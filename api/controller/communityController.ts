import sendResponse from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const Communitycontroller = {
  CreateCommunity: async (req: any, res: any) => {
    try {
      const { name, description } = req.body;
      const userId = req.userId;

      if (!name || !description) {
        return sendResponse(res, 400, "Name and description is Required");
      }

      const existingCommunity = await prisma.community.findUnique({
        where: { name },
      });

      if (existingCommunity) {
        return sendResponse(res, 409, "Community Already Exist");
      }

      const community = await prisma.community.create({
        data: {
          name,
          description,
        },
      });

      await prisma.communityMember.create({
        data: {
          userId,
          communityId: community.id,
          role: "ADMIN",
        },
      });
      return sendResponse(res, 200, "Community Created Successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server Error");
    }
  },
  GetCommunities: async (req: any, res: any) => {
    try {
      const communities = await prisma.community.findMany({
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });
      return sendResponse(
        res,
        200,
        "Communities Retrieved Successfully",
        communities,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  GetSingleCommunity: async (req: any, res: any) => {
    try {
      const { communityId } = req.params;
      const community = await prisma.community.findUnique({
        where: {
          id: communityId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              messages: true,
            },
          },
        },
      });
      if (!community) {
        return sendResponse(res, 404, "Community not Found");
      }
      return sendResponse(res, 200, "Community found Successfully", community);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  GetCommunityMembers: async (req: any, res: any) => {
    try {
      const { communityId } = req.params;
      const communityMembers = await prisma.communityMember.findMany({
        where: {
          communityId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return sendResponse(
        res,
        200,
        "Community Members Retrived Successfully",
        communityMembers,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  JoinCommunity: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { communityId } = req.params;
      const existingMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      });
      if (existingMember) {
        return sendResponse(res, 409, "Already a Member");
      }

      await prisma.communityMember.create({
        data: {
          userId,
          communityId,
        },
      });
      return sendResponse(res, 200, "Joined Community Successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
  DeleteCommunity: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { communityId } = req.params;
      const member = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      });
      if (!member) {
        return sendResponse(res, 404, "You are not a member of this community");
      }

      await prisma.communityMember.delete({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      });
      return sendResponse(res, 200, "Left Community Succesfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal Server Error");
    }
  },
};

export default Communitycontroller;
