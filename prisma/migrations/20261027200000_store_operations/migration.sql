ALTER TABLE "Restaurant" ADD COLUMN "operationSettings" JSONB;
ALTER TABLE "Order" ADD COLUMN "paymentFee" DOUBLE PRECISION;
CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY, "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
  "actorUserId" TEXT, "actorName" TEXT, "actorRole" TEXT, "resource" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL, "action" TEXT NOT NULL, "before" JSONB, "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_restaurantId_createdAt_idx" ON "AuditLog"("restaurantId", "createdAt");
CREATE TABLE "OrderNotification" (
  "id" TEXT PRIMARY KEY, "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL, "orderId" TEXT NOT NULL, "orderNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false,
  "emailStatus" TEXT NOT NULL DEFAULT 'PENDING', "emailAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3), "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("orderId", "status")
);
CREATE INDEX "OrderNotification_restaurantId_userId_createdAt_idx" ON "OrderNotification"("restaurantId", "userId", "createdAt");
CREATE INDEX "OrderNotification_emailStatus_nextAttemptAt_idx" ON "OrderNotification"("emailStatus", "nextAttemptAt");

CREATE FUNCTION hp_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous JSONB; current_row JSONB; tenant TEXT; actor JSONB; safe_before JSONB; safe_after JSONB;
  allowed TEXT[] := ARRAY['name','price','promoPrice','available','featured','categoryId','productId','addonId','order','icon','status','paymentStatus','paymentMethod','paymentCardBrand','paymentFee','total','subtotal','deliveryFee','discount','deliveryPayout','entregadorId','primaryColor','businessHours','operationSettings','description','siteContent','active','code','type','value','minOrderValue','maxUses','expiresAt','singleUsePerUser','blocked','role','deliveryFeePerKm','deliveryRadiusKm','freeDeliveryThreshold','storeCep','customDomain'];
BEGIN
  IF current_setting('app.restore_mode', true) = 'on' THEN RETURN NULL; END IF;
  IF TG_OP <> 'INSERT' THEN previous := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN current_row := to_jsonb(NEW); END IF;
  tenant := CASE WHEN TG_TABLE_NAME = 'Restaurant' THEN COALESCE(current_row, previous)->>'id' ELSE COALESCE(current_row, previous)->>'restaurantId' END;
  IF TG_TABLE_NAME = 'ProductAddon' THEN SELECT "restaurantId" INTO tenant FROM "Product" WHERE "id" = COALESCE(current_row,previous)->>'productId'; END IF;
  IF tenant IS NULL OR NOT EXISTS(SELECT 1 FROM "Restaurant" WHERE "id" = tenant) THEN RETURN NULL; END IF;
  actor := COALESCE(NULLIF(current_setting('app.audit_actor', true), ''), '{}')::jsonb;
  SELECT jsonb_object_agg(key, value) INTO safe_before FROM jsonb_each(COALESCE(previous, '{}'::jsonb)) WHERE key = ANY(allowed);
  SELECT jsonb_object_agg(key, value) INTO safe_after FROM jsonb_each(COALESCE(current_row, '{}'::jsonb)) WHERE key = ANY(allowed);
  IF TG_OP = 'UPDATE' AND safe_before IS NOT DISTINCT FROM safe_after THEN RETURN NEW; END IF;
  INSERT INTO "AuditLog"("id","restaurantId","actorUserId","actorName","actorRole","resource","resourceId","action","before","after")
  VALUES(gen_random_uuid()::text, tenant, actor->>'id', COALESCE(actor->>'name','Operação do sistema'), COALESCE(actor->>'role','SYSTEM'), TG_TABLE_NAME, COALESCE(current_row,previous)->>'id', TG_OP, safe_before, safe_after);
  RETURN NULL;
END $$;
CREATE TRIGGER hp_audit_restaurant AFTER UPDATE ON "Restaurant" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_product AFTER INSERT OR UPDATE OR DELETE ON "Product" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_category AFTER INSERT OR UPDATE OR DELETE ON "Category" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_addon AFTER INSERT OR UPDATE OR DELETE ON "Addon" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_product_addon AFTER INSERT OR UPDATE OR DELETE ON "ProductAddon" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_coupon AFTER INSERT OR UPDATE OR DELETE ON "Coupon" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_order AFTER INSERT OR UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();
CREATE TRIGGER hp_audit_user AFTER INSERT OR UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION hp_audit_change();

CREATE FUNCTION hp_order_notification() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE label TEXT;
BEGIN
  IF current_setting('app.restore_mode', true) = 'on' THEN RETURN NULL; END IF;
  IF TG_OP = 'UPDATE' AND OLD."status" = NEW."status" THEN RETURN NEW; END IF;
  label := CASE NEW."status" WHEN 'RECEBIDO' THEN 'Pedido recebido' WHEN 'ACEITO' THEN 'Pedido aceito' WHEN 'PREPARANDO' THEN 'Seu pedido está em preparo' WHEN 'SAIU_PARA_ENTREGA' THEN 'Seu pedido saiu para entrega' WHEN 'ENTREGUE' THEN 'Pedido entregue' WHEN 'CANCELADO' THEN 'Pedido cancelado' WHEN 'RECUSADO' THEN 'Pedido recusado' ELSE NEW."status"::text END;
  INSERT INTO "OrderNotification"("id","restaurantId","userId","orderId","orderNumber","status","title","message")
  VALUES(gen_random_uuid()::text,NEW."restaurantId",NEW."userId",NEW."id",NEW."number",NEW."status"::text,label,'Pedido #' || NEW."number" || ': ' || label || '.') ON CONFLICT ("orderId","status") DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER hp_order_notification AFTER INSERT OR UPDATE OF "status" ON "Order" FOR EACH ROW EXECUTE FUNCTION hp_order_notification();
