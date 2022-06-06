import * as AWS from "aws-sdk"
const AWSXRay = require('aws-xray-sdk')
import { createLogger } from "../utils/logger"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger("Attachment Utils")

export class AttachmentUtils {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClientInstance(),
        private readonly todosTable = process.env.TODOS_TABLE,
        readonly DEFAULT_REGION: string = "localhost",
        readonly DEFAULT_ENDPOINT: string = "http://localhost:8000"
    ) { }

    async updateAttachmentUrl(todoId: string, userId: string, url: string): Promise<string> {
        logger.info("Update attachment url");
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            UpdateExpression: "set attachmentUrl = :url",
            ExpressionAttributeValues: {
                ":url": url,
            }
        }).promise()
        return url;
    }
}

function createDynamoDBClientInstance() {
    if (process.env.IS_OFFLINE) {
        logger.info("DynamoDB instance is creating...")
        return new XAWS.DynamoDB.DocumentClient({
            region: this.DEFAULT_REGION,
            endpoint: this.DEFAULT_ENDPOINT
        })
    }
    return new XAWS.DynamoDB.DocumentClient();
}