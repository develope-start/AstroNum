import { prisma } from "@/lib/db";

const viewerSelect = {
  id: true,
  adminId: true,
  name: true,
  username: true,
  role: true,
} as const;

export async function recordChartView(chartId: string, viewerId: string, viewerRole: "USER" | "ADMIN") {
  return prisma.chartView.upsert({
    where: { chartId_viewerId: { chartId, viewerId } },
    create: { chartId, viewerId, viewerRole, viewedAt: new Date() },
    update: { viewerRole, viewedAt: new Date() },
    include: { viewer: { select: viewerSelect } },
  });
}

export async function getChartViewSummary(chartId: string) {
  const views = await prisma.chartView.findMany({
    where: { chartId },
    orderBy: { viewedAt: "desc" },
    include: { viewer: { select: viewerSelect } },
  });

  const userView = views.find((view) => view.viewerRole === "USER") ?? null;
  const adminView = views.find((view) => view.viewerRole === "ADMIN") ?? null;

  return {
    userLastViewedAt: userView?.viewedAt.toISOString() ?? null,
    adminLastViewedAt: adminView?.viewedAt.toISOString() ?? null,
    admin: adminView
      ? {
          id: adminView.viewer.id,
          adminId: adminView.viewer.adminId,
          name: adminView.viewer.name,
          username: adminView.viewer.username,
        }
      : null,
  };
}
