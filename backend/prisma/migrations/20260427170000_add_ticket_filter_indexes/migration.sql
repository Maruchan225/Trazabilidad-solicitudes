CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX IF NOT EXISTS "Ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX IF NOT EXISTS "Ticket_inputChannel_idx" ON "Ticket"("inputChannel");
CREATE INDEX IF NOT EXISTS "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");
CREATE INDEX IF NOT EXISTS "Ticket_ticketTypeId_idx" ON "Ticket"("ticketTypeId");
CREATE INDEX IF NOT EXISTS "Ticket_createdAt_idx" ON "Ticket"("createdAt");
CREATE INDEX IF NOT EXISTS "Ticket_dueDate_idx" ON "Ticket"("dueDate");
CREATE INDEX IF NOT EXISTS "Ticket_deleted_createdAt_idx" ON "Ticket"("deleted", "createdAt");
