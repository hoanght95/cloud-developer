import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getTodos } from '../../helpers/todos'
import { getUserId } from '../utils';

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todos = await getTodos(getUserId(event))

    try {
      return {
        statusCode: 200,
        body: JSON.stringify({
          items: todos
        })
      }
    } catch (e) {
      return {
        statusCode: 500,
        body: "Internal Server Error"
      }
    }
  });

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )