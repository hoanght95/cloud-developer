import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo } from '../../helpers/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      return {
        // Resource deleted successfully
        statusCode: 204,
        body: JSON.stringify({
          item: await deleteTodo(event.pathParameters.todoId, getUserId(event))
        })
      };
    } catch (e) {
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
