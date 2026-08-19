import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.js";
import sendResponse from "../utils/response.js";

const Messagecontroller = {
  SendCommunityMessage: async (req: any, res: any) => {
    try {
      const { content } = req.body;
      const userId = req.userId;
      const { communityId } = req.params;
      if (!content) {
        return sendResponse(res, 400, "Message is Required");
      }
      const community = await prisma.community.findUnique({
        where: { id: communityId },
      });
      if (!community) {
        return sendResponse(res, 404, "Community Not Found");
      }
      const isMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      });
      if (!isMember) {
        return sendResponse(
          res,
          403,
          "You are not a member of this community, Join the community to send messages",
        );
      }
      const messages = await prisma.communityMessage.create({
        data: {
          senderId: userId,
          communityId,
          content,
        },
      });
      return sendResponse(res, 200, "Message Sent Successfully", messages);
    } catch (error) {
      sendResponse(res, 500, "Error sending community message");
    }
  },
  GetCommunityMessages: async (req: any, res: any) => {
    try {
      const { communityId } = req.params;
      const messages = await prisma.communityMessage.findMany({
        where: {
          communityId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          views: {
            select: {
              //   userId: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return sendResponse(
        res,
        200,
        "Messages Retrieved Successfully",
        messages,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  ViewCommunityMessage: async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.userId;
      const existingView = await prisma.messageView.findUnique({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
      });
      if (!existingView) {
        await prisma.messageView.create({
          data: {
            userId,
            messageId,
          },
        });
      }

      return sendResponse(res, 200, "Message Viewed Successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  DeleteCommunityMessage: async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.userId;
      const message = await prisma.communityMessage.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message) {
        return sendResponse(res, 404, "Message Not Found");
      }
      if (message.senderId !== userId && userId.role !== "ADMIN") {
        return sendResponse(
          res,
          403,
          "You are not authorized to delete this message",
        );
      }
      await prisma.communityMessage.delete({
        where: {
          id: messageId,
        },
      });
      return sendResponse(res, 200, "Message Deleted Successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
};

export default Messagecontroller;
