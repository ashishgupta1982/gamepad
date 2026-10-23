// Server-only: handles and the memory of questions seen, for the routes. The
// rules are lib/quiz/memory.js, shared with the scripts; this connects first.
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import * as memory from './memory';

const db = async () => {
  await dbConnect();
  return mongoose.connection.db;
};

/** Every question any of these players has seen (a guest host's game: signed-in players only). */
export const seenBy = async (host, names) => memory.seenBy(await db(), host || null, names);

/** Add a game's questions to each player's memory. */
export const remember = async (host, names, ids) => memory.remember(await db(), host || null, names, ids);

/** The players this account remembers, most recently played first. */
export const listSeen = async (host) => memory.listSeen(await db(), host);

/** Forget one player's questions. */
export const forget = async (host, name) => memory.forget(await db(), host, name);

/** This account's handle, given one if it has none. */
export const handleOf = async (email) => memory.handleOf(await db(), email);

/** Change this account's handle. */
export const claimHandle = async (email, name) => memory.claimHandle(await db(), email, name);

/** Whose handle this name is: an email, or null. */
export const handleOwner = async (name) => memory.handleOwner(await db(), name);
