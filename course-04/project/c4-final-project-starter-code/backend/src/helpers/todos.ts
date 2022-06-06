import { TodosAccess } from "./todosAcess"
import { AttachmentUtils } from "./attachmentUtils";
import { TodoItem } from "../models/TodoItem"
import { CreateTodoRequest } from "../requests/CreateTodoRequest"
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest"
import { createLogger } from "../utils/logger"
import * as uuid from "uuid"
import { TodoUpdate } from "../models/TodoUpdate"
import * as AWS from "aws-sdk"

let todoAccess = new TodosAccess();
let utils = new AttachmentUtils();
const logger = createLogger("Todo logic")
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const signedURLExpiration = process.env.SIGNED_URL_EXPIRATION;
const s3 = new AWS.S3({
    signatureVersion: "v4"
})

// Create Todo
export async function createTodo(userId: string, createRequest: CreateTodoRequest): Promise<TodoItem> {
    return await todoAccess.createTodo({
        todoId: uuid.v4(),
        userId: userId,
        name: createRequest.name,
        dueDate: createRequest.dueDate,
        createdAt: new Date().toISOString(),
        done: false
    });
}

// Get todo list
export async function getTodos(userId: string): Promise<TodoItem[]> {
    return todoAccess.getTodos(userId);
}

// Update todo
export async function updateTodo(todoId: string, userId: string, updateRequest: UpdateTodoRequest): Promise<TodoUpdate> {
    return await todoAccess.updateTodo(todoId, userId, {
        name: updateRequest.name,
        dueDate: updateRequest.dueDate,
        done: updateRequest.done
    });
}

//Delete todo
export async function deleteTodo(todoId: string, userId: string) {
    await todoAccess.deleteTodo(todoId, userId);
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string) {
    const imageId = uuid.v4();
    const url = `https://${bucketName}.s3.amazonaws.com/${imageId}`;
    await utils.updateAttachmentUrl(todoId, userId, url);
    logger.info("Create presigned URL");
    return getSignedUrl(imageId);
}

function getSignedUrl(imageId: string) {
    logger.info("signedURLExpiration:", signedURLExpiration);
    return s3.getSignedUrl("putObject", {
        Bucket: bucketName,
        Key: imageId,
        Expires: Number(signedURLExpiration)
    });
}