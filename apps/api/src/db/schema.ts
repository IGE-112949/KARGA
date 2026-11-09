import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, uuid, text, boolean, timestamp, numeric, smallint, time, geometry, index, uniqueIndex, check,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const plugType = pgEnum('plug_type', ['type2', 'schuko', 'ccs']);
export const spaceType = pgEnum('space_type', ['closed_garage', 'covered', 'outdoor']);
export const spaceStatus = pgEnum('space_status', ['active', 'inactive', 'deleted']);
export const bookingStatus = pgEnum('booking_status', ['confirmed', 'cancelled_by_driver', 'cancelled_by_host', 'completed']);

// id = auth.users.id (FK criada na migração manual 0002)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isDriver: boolean('is_driver').notNull().default(false),
  isHost: boolean('is_host').notNull().default(false),
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  check('profiles_has_role', sql`${t.isDriver} or ${t.isHost}`),
]);

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  makeModel: text('make_model').notNull(),
  plate: text('plate').notNull().unique('vehicles_plate_unique'),
  plugType: plugType('plug_type').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex('vehicles_one_default_per_user').on(t.userId).where(sql`${t.isDefault}`),
]);

export const spaces = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  spotDetails: text('spot_details'),
  location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
  spaceType: spaceType('space_type').notNull(),
  powerKw: numeric('power_kw', { precision: 4, scale: 1 }).notNull(),
  plugType: plugType('plug_type').notNull(),
  accessInstructions: text('access_instructions'),
  accessCode: text('access_code'),
  pricePerHour: numeric('price_per_hour', { precision: 6, scale: 2 }).notNull(),
  energyPriceKwh: numeric('energy_price_kwh', { precision: 5, scale: 3 }),
  status: spaceStatus('status').notNull().default('active'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index('spaces_location_gist').using('gist', t.location),
  index('spaces_owner_idx').on(t.ownerId),
  check('spaces_power_positive', sql`${t.powerKw} > 0`),
  check('spaces_price_positive', sql`${t.pricePerHour} > 0`),
  check('spaces_energy_price_positive', sql`${t.energyPriceKwh} is null or ${t.energyPriceKwh} > 0`),
  check('spaces_access_code_length', sql`${t.accessCode} is null or char_length(${t.accessCode}) <= 20`),
]);

export const spacePhotos = pgTable('space_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceId: uuid('space_id').notNull().references(() => spaces.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  position: smallint('position').notNull().default(0),
  createdAt: createdAt(),
});

// weekday: 0 = segunda … 6 = domingo; end_time <= start_time => atravessa a meia-noite (Europe/Lisbon)
export const spaceAvailability = pgTable('space_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceId: uuid('space_id').notNull().references(() => spaces.id, { onDelete: 'cascade' }),
  weekday: smallint('weekday').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  createdAt: createdAt(),
}, (t) => [
  check('space_availability_weekday', sql`${t.weekday} between 0 and 6`),
  uniqueIndex('space_availability_one_per_day').on(t.spaceId, t.weekday),
]);

export const spaceBlocks = pgTable('space_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceId: uuid('space_id').notNull().references(() => spaces.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
  createdAt: createdAt(),
}, (t) => [
  check('space_blocks_range', sql`${t.endsAt} > ${t.startsAt}`),
]);

// Exclusion constraint (sem sobreposição de reservas confirmadas) na migração manual 0002
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  // restrict: o histórico de reservas nunca é apagado por arrasto (espaços são eliminados por estado)
  spaceId: uuid('space_id').notNull().references(() => spaces.id, { onDelete: 'restrict' }),
  driverId: uuid('driver_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: bookingStatus('status').notNull().default('confirmed'),
  pricePerHour: numeric('price_per_hour', { precision: 6, scale: 2 }).notNull(),
  energyPriceKwh: numeric('energy_price_kwh', { precision: 5, scale: 3 }),
  serviceFeePercent: numeric('service_fee_percent', { precision: 5, scale: 2 }).notNull(),
  serviceFee: numeric('service_fee', { precision: 6, scale: 2 }).notNull(),
  estimatedTotal: numeric('estimated_total', { precision: 8, scale: 2 }).notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index('bookings_space_idx').on(t.spaceId),
  index('bookings_driver_idx').on(t.driverId),
  check('bookings_range', sql`${t.endsAt} > ${t.startsAt}`),
  check('bookings_price_positive', sql`${t.pricePerHour} > 0`),
]);

export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(),
  value: numeric('value').notNull(),
  updatedAt: updatedAt(),
});
