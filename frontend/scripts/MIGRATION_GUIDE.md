# Event ID Migration Guide

## 🚨 Important: Read Before Running

This guide helps you migrate existing events from long Appwrite IDs to short, user-friendly IDs.

---

## ⚠️ Prerequisites

1. **Backup your data** - This is a one-way migration
2. **Test environment** - Run on staging/dev first
3. **Admin access** - Requires full database permissions

---

## 🎯 What This Migration Does

### Events Collection
- **Updates:** `event_page_url` field
- **From:** Long URL like `https://lyperos.com/event/68e70b5d002ddfaed7bf`
- **To:** Short ID like `a3f-k9z-2b7`

### Attendees Collection
- **Updates:** Adds `event_id` field
- **From:** Uses relationship field or old `eventId`
- **To:** Direct reference using short ID

---

## 📋 Migration Options

### Option 1: Automatic Script (Recommended)

**Location:** `/frontend/scripts/migrateEventIds.ts`

**Steps:**

1. **Test on one event first:**
```typescript
// In migrateEventIds.ts, uncomment:
testMigrationOnOneEvent();

// Then run:
npx tsx frontend/scripts/migrateEventIds.ts
```

2. **If test passes, run full migration:**
```typescript
// In migrateEventIds.ts, uncomment:
migrateEventsToShortIds();

// Then run:
npx tsx frontend/scripts/migrateEventIds.ts
```

**Output:**
```
🔄 Starting migration to short event IDs...
📋 Fetching all events...
✅ Found 25 events to migrate
✅ Updated event "Tech Conference 2025" → a3f-k9z-2b7
✅ Updated event "Music Festival" → x8k-p2m-9n1
...
✨ Migration complete!
📊 Events updated: 25
📊 Attendees updated: 142
```

---

### Option 2: Manual Migration (Appwrite Console)

If you prefer manual control:

1. **Go to Appwrite Console** → Your Database → `events-collection`

2. **For each event:**
   - Generate short ID (use format: `xxx-xxx-xxx`)
   - Update `event_page_url` field with the short ID
   - Note the document ID and new short ID

3. **Go to** `attendees-collection`

4. **For each attendee:**
   - Find their old event reference
   - Add new `event_id` field with the short ID
   - Save changes

---

### Option 3: Fresh Start (Development Only)

If you're in development with test data:

1. **Delete all documents** in `attendees-collection`
2. **Delete all documents** in `events-collection`
3. **Create new events** - they'll automatically use short IDs

---

## 🔍 Verification Steps

After migration, verify everything works:

### 1. Check Events
```typescript
// In browser console or script
const databases = new Databases(client);
const events = await databases.listDocuments(DB_ID, EVENTS_COLLECTION);

events.documents.forEach(event => {
  console.log(event.event_name, '→', event.event_page_url);
  // Should show: "Event Name → a3f-k9z-2b7" (not full URL)
});
```

### 2. Check Attendees
```typescript
const attendees = await databases.listDocuments(DB_ID, ATTENDEES_COLLECTION);

attendees.documents.forEach(attendee => {
  console.log(attendee.email, '→', attendee.event_id);
  // Should show: "user@email.com → a3f-k9z-2b7"
});
```

### 3. Test User Flow
- [ ] Create new event → Check short ID generated
- [ ] View event at `/event/xxx-xxx-xxx` → Loads correctly
- [ ] Register for event → Creates attendee with event_id
- [ ] View "Registered" tab → Shows correct events
- [ ] Share event link → Short URL works

---

## 🐛 Troubleshooting

### Events not loading after migration

**Problem:** Event pages showing "Event not found"

**Solution:** Check that:
1. `event_page_url` contains just the short ID (not full URL)
2. Short ID format is correct: `xxx-xxx-xxx` (3-3-3 pattern)
3. EventPage.tsx is querying by `event_page_url` field

**Test:**
```typescript
// Should return the event
const result = await databases.listDocuments(
  DB_ID, 
  EVENTS_COLLECTION,
  [Query.equal('event_page_url', 'a3f-k9z-2b7')]
);
```

### Registered events not showing

**Problem:** "Registered" tab is empty

**Solution:** Check that:
1. Attendees have `event_id` field populated
2. `event_id` matches `event_page_url` in events
3. EventsPage.tsx is querying correctly

**Test:**
```typescript
// Get attendees for your email
const attendees = await databases.listDocuments(
  DB_ID,
  ATTENDEES_COLLECTION,
  [Query.equal('email', 'your@email.com')]
);

// Check event_id field exists
console.log(attendees.documents.map(a => a.event_id));

// Should show: ["a3f-k9z-2b7", "x8k-p2m-9n1", ...]
```

### Duplicate event IDs

**Problem:** Two events with same short ID (unlikely but possible)

**Solution:**
1. Generate new short ID for one event
2. Update manually in Appwrite Console
3. Update affected attendee records

**Note:** With 36^9 combinations (~100 trillion), collision probability is near zero.

---

## 📊 Rollback Plan

If migration fails and you need to revert:

### If you backed up data:
1. Restore from backup
2. Check all relationships
3. Test user flows

### If no backup (⚠️ not recommended):
1. Migration script logs old → new mappings
2. Manually revert using logs
3. Update attendees to use old references

**Prevention:** Always test on staging first!

---

## 📝 Post-Migration Checklist

- [ ] All events have short IDs in `event_page_url`
- [ ] All attendees have `event_id` field
- [ ] Event pages load at `/event/xxx-xxx-xxx`
- [ ] Registration creates correct attendee records
- [ ] Payment flow works end-to-end
- [ ] "Registered" tab shows correct events
- [ ] Share links work (short URLs)
- [ ] Email confirmations include correct links

---

## 🎯 Next Steps

After successful migration:

1. **Update marketing materials** with new short URLs
2. **Test production environment** thoroughly
3. **Monitor error logs** for any issues
4. **Document any custom changes** for your team

---

## 💡 Tips

1. **Run during low traffic** - Minimize user disruption
2. **Monitor database** - Watch for errors during migration
3. **Test thoroughly** - Try all user flows after migration
4. **Keep logs** - Save migration output for reference
5. **Communicate** - Inform users about URL changes

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check Appwrite logs in console
3. Verify database schema matches [SHORT_EVENT_ID_SYSTEM.md](../SHORT_EVENT_ID_SYSTEM.md)
4. Review migration logs for specific errors

---

**Migration Status:** 🟡 Required for existing data  
**Estimated Time:** 2-5 minutes for 100 events  
**Risk Level:** 🟡 Medium (test first!)

