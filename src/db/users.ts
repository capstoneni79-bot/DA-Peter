import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  role = 'focal',
  assignedBarangay?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name,
        role,
        assignedBarangay,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed for getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed for getUserByUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
