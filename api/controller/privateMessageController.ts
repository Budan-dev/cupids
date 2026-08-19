import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.js";
import sendResponse from "../utils/response.js";

const PrivateMessageController = {
  SendPrivateMessage: async (req: any, res: any) => {
    try {
      const { content } = req.body;
      const { receiverUsername } = req.params;
      const senderID = req.userId;
      if (!content || !receiverUsername) {
        return sendResponse(
          res,
          400,
          "Content and Receiver Username are required",
        );
      }
      const receiver = await prisma.user.findUnique({
        where: {
          username: receiverUsername,
        },
      });
      if (!receiver) {
        return sendResponse(
          res,
          404,
          "Receiver not found with the provided username",
        );
      }
      if (senderID && senderID === receiver.id) {
        return sendResponse(
          res,
          400,
          "You cannot send a private message to yourself",
        );
      }
      const privateMessage = await prisma.privateMessage.create({
        data: {
          senderId: senderID,
          receiverId: receiver.id,
          content,
        },
      });
      return sendResponse(
        res,
        201,
        "Private Message Sent Successfully",
        privateMessage,
      );
    } catch (error) {
      console.error("SendPrivateMessage Error:", error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  GetPrivateMessages: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const privateMessages = await prisma.privateMessage.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return sendResponse(
        res,
        200,
        "Private Messages Retrieved Successfully",
        privateMessages,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  ViewPrivateMessage: async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.userId;
      const privateMessage = await prisma.privateMessage.findFirst({
        where: {
          id: messageId,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });

      if (!privateMessage) {
        return sendResponse(res, 404, "Private Message not found");
      }

      await prisma.privateMessage.update({
        where: {
          id: messageId,
        },
        data: {
          viewed: true,
        },
      });
      return sendResponse(
        res,
        200,
        "Private Message Viewed Successfully",
        privateMessage,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },

  DeletePrivateMessage: async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.userId;

      const privateMessage = await prisma.privateMessage.findFirst({
        where: {
          id: messageId,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });

      const messageAuthor = await prisma.privateMessage.findUnique({
        where: {
          id: messageId,
          senderId: userId,
        },
      });

      if (!messageAuthor) {
        return sendResponse(
          res,
          403,
          "You are not authorized to delete this message",
        );
      }

      if (!privateMessage) {
        return sendResponse(res, 404, "Private Message not found");
      }

      await prisma.privateMessage.delete({
        where: {
          id: messageId,
        },
      });

      return sendResponse(res, 200, "Private Message Deleted Successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
};

export default PrivateMessageController;
