import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('Auth0')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-e0bbd6ud.us.auth0.com/.well-known/jwks.json';
const APPLICATION_JSON = 'application/json';

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  let response = await Axios.get(jwksUrl, {
    headers: {
      'Accept': APPLICATION_JSON,
      'Content-Type': APPLICATION_JSON,
      'Access-Control-Allow-Origin': "*",
      'Access-Control-Allow-Credentials': true,
    }
  });
  const key = await getSigningKey(response.data.keys, jwt.header.kid);
  return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

const getSigningKey = async (keys, kid) => {
  const signingKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
    && key.kty === 'RSA' // We are only supporting RSA (RS256)
    && key.kid           // The `kid` must be present to be useful for later
    && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
  ).map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
  });
  const signingKey = signingKeys.find(key => key.kid === kid);

  if (!signingKey) {
    logger.error("The JWKS endpoint did not contain any signature verification keys");
    throw new Error('The JWKS endpoint did not contain any signature verification keys');
  }
  logger.info("Available signing keys", signingKey);

  return signingKey;
};

const certToPEM = (cert) => {
  const certKeyFormatted = cert.match(/.{1,64}/g).join("\n")
  const certContents =
    '-----BEGIN CERTIFICATE-----' + "\n" +
    certKeyFormatted + "\n" +
    '-----END CERTIFICATE-----'
  logger.info('Generated certificate: '  + certContents);
  return certContents;
}