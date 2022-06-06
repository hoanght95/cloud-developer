import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../helpers/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      return {
        // Request was successful and as a result, a resource has been created
        statusCode: 201,
        body: JSON.stringify({
          uploadUrl: await createAttachmentPresignedUrl(event.pathParameters.todoId, getUserId(event))
        })
      }
    } catch(e) {
      return {
        statusCode: 500,
        body: "Internal Server Error"
      }
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
