import { prisma } from "@/lib/db";

export interface SocialChannelConfig {
  id: "whatsapp" | "messenger" | "telegram" | "phone";
  label: string;
  value: string;
  enabled: boolean;
  href: string;
}

export interface SocialSettingsData {
  whatsapp: { value: string; enabled: boolean };
  messenger: { value: string; enabled: boolean };
  telegram: { value: string; enabled: boolean };
  phone: { value: string; enabled: boolean };
}

const DEFAULT_SETTINGS: SocialSettingsData = {
  whatsapp: { value: "+995599000000", enabled: true },
  messenger: { value: "https://m.me/astronum.ge", enabled: true },
  telegram: { value: "astronum_ge", enabled: false },
  phone: { value: "+995599000000", enabled: true },
};

const SOCIAL_KEYS = [
  "social.whatsapp.value",
  "social.whatsapp.enabled",
  "social.messenger.value",
  "social.messenger.enabled",
  "social.telegram.value",
  "social.telegram.enabled",
  "social.phone.value",
  "social.phone.enabled",
] as const;

export async function getSocialSettings(): Promise<SocialSettingsData> {
  try {
    const saved = await prisma.appSetting.findMany({
      where: { key: { in: [...SOCIAL_KEYS] } },
      select: { key: true, value: true },
    });
    const map = new Map(saved.map((s) => [s.key, s.value]));

    return {
      whatsapp: {
        value: map.get("social.whatsapp.value") ?? DEFAULT_SETTINGS.whatsapp.value,
        enabled: map.get("social.whatsapp.enabled") !== undefined ? map.get("social.whatsapp.enabled") === "true" : DEFAULT_SETTINGS.whatsapp.enabled,
      },
      messenger: {
        value: map.get("social.messenger.value") ?? DEFAULT_SETTINGS.messenger.value,
        enabled: map.get("social.messenger.enabled") !== undefined ? map.get("social.messenger.enabled") === "true" : DEFAULT_SETTINGS.messenger.enabled,
      },
      telegram: {
        value: map.get("social.telegram.value") ?? DEFAULT_SETTINGS.telegram.value,
        enabled: map.get("social.telegram.enabled") !== undefined ? map.get("social.telegram.enabled") === "true" : DEFAULT_SETTINGS.telegram.enabled,
      },
      phone: {
        value: map.get("social.phone.value") ?? DEFAULT_SETTINGS.phone.value,
        enabled: map.get("social.phone.enabled") !== undefined ? map.get("social.phone.enabled") === "true" : DEFAULT_SETTINGS.phone.enabled,
      },
    };
  } catch (error) {
    console.error("Failed to load social settings, using defaults:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSocialSettings(data: Partial<SocialSettingsData>): Promise<SocialSettingsData> {
  const operations = [];

  if (data.whatsapp) {
    if (data.whatsapp.value !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.whatsapp.value" },
        create: { key: "social.whatsapp.value", value: data.whatsapp.value },
        update: { value: data.whatsapp.value },
      }));
    }
    if (data.whatsapp.enabled !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.whatsapp.enabled" },
        create: { key: "social.whatsapp.enabled", value: String(data.whatsapp.enabled) },
        update: { value: String(data.whatsapp.enabled) },
      }));
    }
  }

  if (data.messenger) {
    if (data.messenger.value !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.messenger.value" },
        create: { key: "social.messenger.value", value: data.messenger.value },
        update: { value: data.messenger.value },
      }));
    }
    if (data.messenger.enabled !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.messenger.enabled" },
        create: { key: "social.messenger.enabled", value: String(data.messenger.enabled) },
        update: { value: String(data.messenger.enabled) },
      }));
    }
  }

  if (data.telegram) {
    if (data.telegram.value !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.telegram.value" },
        create: { key: "social.telegram.value", value: data.telegram.value },
        update: { value: data.telegram.value },
      }));
    }
    if (data.telegram.enabled !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.telegram.enabled" },
        create: { key: "social.telegram.enabled", value: String(data.telegram.enabled) },
        update: { value: String(data.telegram.enabled) },
      }));
    }
  }

  if (data.phone) {
    if (data.phone.value !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.phone.value" },
        create: { key: "social.phone.value", value: data.phone.value },
        update: { value: data.phone.value },
      }));
    }
    if (data.phone.enabled !== undefined) {
      operations.push(prisma.appSetting.upsert({
        where: { key: "social.phone.enabled" },
        create: { key: "social.phone.enabled", value: String(data.phone.enabled) },
        update: { value: String(data.phone.enabled) },
      }));
    }
  }

  await prisma.$transaction(operations);
  return getSocialSettings();
}
