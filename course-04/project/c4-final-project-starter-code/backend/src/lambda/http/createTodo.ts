import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const createdTodo: CreateTodoRequest = JSON.parse(event.body)
    try {
      return {
        // Request was successful and as a result, a resource has been created
        statusCode: 201,
        body: JSON.stringify({
          item: await createTodo(getUserId(event), createdTodo)
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
