import { prisma } from "@/lib/prisma";
import type { Address } from "@prisma/client";

export type CreateAddressInput = {
  label?: string | null;
  recipient: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

export async function listAddressesByUser(userId: string): Promise<Address[]> {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
}

export async function getAddressById(userId: string, id: string): Promise<Address | null> {
  return prisma.address.findFirst({ where: { id, userId } });
}

export async function createAddress(userId: string, data: CreateAddressInput): Promise<Address> {
  // if creating as default, ensure others are unset
  const created = await prisma.address.create({ data: { userId, ...data } });
  return created;
}

export async function updateAddress(userId: string, id: string, data: Partial<CreateAddressInput & { isDefault?: boolean; isFavorite?: boolean }>): Promise<Address | null> {
  // if setting isDefault true, unset other defaults
  if ((data as any).isDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const updated = await prisma.address.updateMany({ where: { id, userId }, data } as any);
  if (updated.count === 0) return null;
  return getAddressById(userId, id);
}

export async function deleteAddress(userId: string, id: string): Promise<boolean> {
  const result = await prisma.address.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export async function setDefaultAddress(userId: string, id: string): Promise<Address | null> {
  // unset others
  await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  const updated = await prisma.address.update({ where: { id }, data: { isDefault: true } });
  // ensure owner
  if (updated.userId !== userId) return null;
  return updated;
}

export async function setFavoriteAddress(userId: string, id: string, value: boolean): Promise<Address | null> {
  const updated = await prisma.address.updateMany({ where: { id, userId }, data: { isFavorite: value } });
  if (updated.count === 0) return null;
  return getAddressById(userId, id);
}

export default {} as const;
