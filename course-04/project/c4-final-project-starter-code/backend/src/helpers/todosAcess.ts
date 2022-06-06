import * as AWS from "aws-sdk"
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { createLogger } from "../utils/logger"
import { TodoItem } from "../models/TodoItem"
import { TodoUpdate } from "../models/TodoUpdate";

const XAWS = AWSXRay.captureAWS(AWS)


const logger = createLogger("TodosAccess")

export class TodosAccess {

    constructor(
        readonly docClient: DocumentClient = createDynamoDBClientInstance(),
        readonly todosTable = process.env.TODOS_TABLE,
        readonly todoCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX,
        readonly DEFAULT_REGION: string = "localhost",
        readonly DEFAULT_ENDPOINT: string = "http://localhost:8000"
    ) { }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info("Create todo");
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()

        return todoItem;
    }

    async getTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todoCreatedAtIndex,
            KeyConditionExpression: "userId = :pk",
            ExpressionAttributeValues: {
                ":pk": userId
            }
        }).promise()

        return result.Items as TodoItem[];
    }

    async updateTodo(todoId: String, userId: String, updateTodoItem: TodoUpdate): Promise<TodoUpdate> {
        logger.info("Update todo...");
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            UpdateExpression: "set #todo_name = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeNames: {
                "#todo_name": "name",
            },
            ExpressionAttributeValues: {
                ":name": updateTodoItem.name,
                ":dueDate": updateTodoItem.dueDate,
                ":done": updateTodoItem.done
            }
        }).promise()

        return updateTodoItem;
    }

    async deleteTodo(todoId: String, userId: String) {
        logger.info("Delete todo...");

        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }, (err) => {
            if (err) {
                logger.error("Error when tried to delete todo")
                throw new Error("")
            }
        }).promise()
    }

}

function createDynamoDBClientInstance() {
    if (process.env.IS_OFFLINE) {
        logger.info("DynamoDB instance is creating...");
        return new XAWS.DynamoDB.DocumentClient({
            region: this.DEFAULT_REGION,
            endpoint: this.DEFAULT_ENDPOINT
        });
    }
    return new XAWS.DynamoDB.DocumentClient();
}