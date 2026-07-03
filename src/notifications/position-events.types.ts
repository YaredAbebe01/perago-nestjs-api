export const POSITION_EVENTS_EXCHANGE = 'organization.events';
export const POSITION_EVENTS_ROUTING_PREFIX = 'position';

export type PositionChangeEventType =
  | 'position.created'
  | 'position.updated'
  | 'position.deleted';

export type PositionSnapshot = {
  id: string;
  name: string;
  description: string;
  email: string | null;
  parentId: string | null;
};

export type PositionChangeEvent = {
  eventId: string;
  eventType: PositionChangeEventType;
  entityType: 'position';
  occurredAt: string;
  positionId: string;
  positionName: string;
  position: PositionSnapshot;
  actorId?: string | null;
  changes?: {
    before: PositionSnapshot;
    after: PositionSnapshot;
  };
};