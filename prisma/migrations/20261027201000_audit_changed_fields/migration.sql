ALTER TABLE "AuditLog" ADD COLUMN "changedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE OR REPLACE FUNCTION hp_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous JSONB; current_row JSONB; tenant TEXT; actor JSONB; safe_before JSONB; safe_after JSONB; changed TEXT[];
  allowed TEXT[] := ARRAY['name','price','promoPrice','available','featured','categoryId','productId','addonId','order','icon','status','paymentStatus','paymentMethod','paymentCardBrand','paymentFee','total','subtotal','deliveryFee','discount','deliveryPayout','entregadorId','primaryColor','businessHours','operationSettings','description','siteContent','active','code','type','value','minOrderValue','maxUses','expiresAt','singleUsePerUser','blocked','role','deliveryFeePerKm','deliveryRadiusKm','freeDeliveryThreshold','storeCep','customDomain'];
BEGIN
  IF current_setting('app.restore_mode', true) = 'on' THEN RETURN NULL; END IF;
  IF TG_OP <> 'INSERT' THEN previous := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN current_row := to_jsonb(NEW); END IF;
  tenant := CASE WHEN TG_TABLE_NAME = 'Restaurant' THEN COALESCE(current_row, previous)->>'id' ELSE COALESCE(current_row, previous)->>'restaurantId' END;
  IF TG_TABLE_NAME = 'ProductAddon' THEN SELECT "restaurantId" INTO tenant FROM "Product" WHERE "id" = COALESCE(current_row,previous)->>'productId'; END IF;
  IF tenant IS NULL OR NOT EXISTS(SELECT 1 FROM "Restaurant" WHERE "id" = tenant) THEN RETURN NULL; END IF;
  SELECT array_agg(key ORDER BY key) INTO changed FROM jsonb_each(COALESCE(current_row, previous))
    WHERE key <> ALL(ARRAY['updatedAt','lastAccess','soldCount','rating','usedCount'])
    AND (TG_OP <> 'UPDATE' OR value IS DISTINCT FROM previous->key);
  IF TG_OP = 'UPDATE' AND COALESCE(array_length(changed,1),0) = 0 THEN RETURN NEW; END IF;
  actor := COALESCE(NULLIF(current_setting('app.audit_actor', true), ''), '{}')::jsonb;
  SELECT jsonb_object_agg(key, value) INTO safe_before FROM jsonb_each(COALESCE(previous, '{}'::jsonb)) WHERE key = ANY(allowed);
  SELECT jsonb_object_agg(key, value) INTO safe_after FROM jsonb_each(COALESCE(current_row, '{}'::jsonb)) WHERE key = ANY(allowed);
  INSERT INTO "AuditLog"("id","restaurantId","actorUserId","actorName","actorRole","resource","resourceId","action","changedFields","before","after")
  VALUES(gen_random_uuid()::text, tenant, actor->>'id', COALESCE(actor->>'name','Operação do sistema'), COALESCE(actor->>'role','SYSTEM'), TG_TABLE_NAME, COALESCE(current_row,previous)->>'id', TG_OP, COALESCE(changed,ARRAY[]::TEXT[]), safe_before, safe_after);
  RETURN NULL;
END $$;
