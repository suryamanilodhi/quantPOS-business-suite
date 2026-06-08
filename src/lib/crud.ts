import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { recordActivity } from "@/lib/activity";
import { Permission } from "@/lib/permissions";
import { handleError, json, parseBody, problem, shopScope, withAuth } from "@/lib/api";

type Delegate = {
  findMany(args?: any): Promise<any>;
  findFirst(args?: any): Promise<any>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
};

export function collectionHandlers(delegate: Delegate, schema: ZodSchema, permission: Permission, options?: { include?: any; orderBy?: any; beforeCreate?: (data: any, user: any) => any | Promise<any> }) {
  return {
    async GET(request: NextRequest) {
      try {
        const user = await withAuth(request, permission);
        const search = request.nextUrl.searchParams.get("q")?.trim();
        const where = { ...shopScope(user), ...(search ? { name: { contains: search, mode: "insensitive" } } : {}) };
        const data = await delegate.findMany({ where, include: options?.include, orderBy: options?.orderBy ?? { createdAt: "desc" } });
        return json(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async POST(request: NextRequest) {
      try {
        const user = await withAuth(request, permission);
        const parsed = await parseBody(request, schema);
        const data = options?.beforeCreate ? await options.beforeCreate(parsed, user) : { ...parsed, shopId: user.shopId };
        const created = await delegate.create({ data, include: options?.include });
        await recordActivity({
          user,
          action: "CREATE",
          resource: permission,
          resourceId: created.id,
          message: `Created ${permission} record`,
          metadata: { name: created.name ?? created.invoiceNumber ?? created.category ?? null }
        });
        return json(created, { status: 201 });
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

export function itemHandlers(delegate: Delegate, schema: ZodSchema, permission: Permission, options?: { include?: any; beforeUpdate?: (data: any, user: any) => any | Promise<any> }) {
  return {
    async GET(request: NextRequest, context: { params: { id: string } }) {
      try {
        const user = await withAuth(request, permission);
        const data = await delegate.findFirst({ where: { id: context.params.id, ...shopScope(user) }, include: options?.include });
        if (!data) return problem("Not found", 404);
        return json(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async PUT(request: NextRequest, context: { params: { id: string } }) {
      try {
        const user = await withAuth(request, permission);
        const existing = await delegate.findFirst({ where: { id: context.params.id, ...shopScope(user) } });
        if (!existing) return problem("Not found", 404);
        const parsed = await parseBody(request, schema);
        const data = options?.beforeUpdate ? await options.beforeUpdate(parsed, user) : parsed;
        const updated = await delegate.update({ where: { id: context.params.id }, data, include: options?.include });
        await recordActivity({
          user,
          action: "UPDATE",
          resource: permission,
          resourceId: updated.id,
          message: `Updated ${permission} record`,
          metadata: { name: updated.name ?? updated.invoiceNumber ?? updated.category ?? null }
        });
        return json(updated);
      } catch (error) {
        return handleError(error);
      }
    },
    async DELETE(request: NextRequest, context: { params: { id: string } }) {
      try {
        const user = await withAuth(request, permission);
        const existing = await delegate.findFirst({ where: { id: context.params.id, ...shopScope(user) } });
        if (!existing) return problem("Not found", 404);
        await delegate.delete({ where: { id: context.params.id } });
        await recordActivity({
          user,
          action: "DELETE",
          resource: permission,
          resourceId: context.params.id,
          message: `Deleted ${permission} record`,
          metadata: { name: existing.name ?? existing.invoiceNumber ?? existing.category ?? null }
        });
        return json({ ok: true });
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
