import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ActivityUser = {
  id: string;
  shopId: string | null;
  role: string;
  name?: string;
};

type ActivityInput = {
  user: ActivityUser;
  action: string;
  resource: string;
  resourceId?: string | null;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

type ActivityDelegate = {
  activityLog: {
    create(args: { data: Prisma.ActivityLogUncheckedCreateInput }): Promise<unknown>;
  };
};

export async function recordActivity({ user, action, resource, resourceId, message, metadata }: ActivityInput) {
  if (!user.shopId) return;

  try {
    await prisma.activityLog.create({
      data: {
        shopId: user.shopId,
        userId: user.id,
        action,
        resource,
        resourceId: resourceId ?? null,
        message,
        metadata
      }
    });
  } catch (error) {
    console.error("Unable to record activity", error);
  }
}

export async function recordActivityInTransaction(
  tx: ActivityDelegate,
  { user, action, resource, resourceId, message, metadata }: ActivityInput
) {
  if (!user.shopId) return;

  await tx.activityLog.create({
    data: {
      shopId: user.shopId,
      userId: user.id,
      action,
      resource,
      resourceId: resourceId ?? null,
      message,
      metadata
    }
  });
}
