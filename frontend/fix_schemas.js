const fs = require('fs');

const schema = fs.readFileSync('database/schemas.ts', 'utf-8');

// List of fields that are indexed and need maxLength
const fixMap = {
  'title': 500,
  'description': 5000,
  'date': 50,
  'time': 50,
  'location': 500,
  'createdBy': 100,
  'createdByName': 200,
  'meetingId': 100,
  'eventId': 100,
  'userEmail': 200,
  'userName': 200,
  'status': 50,
  'ownerId': 100,
  'updatedAt': 50,
  'updatedAtTimestamp': 50,
  'createdAt': 50,
  'content': 10000000,
  'elements': 10000000,
  'appState': 100000,
  'type': 50,
  'name': 300,
  'lastMessageAt': 50,
  'conversationId': 100,
  'senderId': 100,
  'senderName': 200,
  'text': 10000,
  'fileId': 100,
  'fileName': 300,
  'fileUrl': 500,
};

let result = schema;

// For each field, add maxLength if it doesn't have one
Object.entries(fixMap).forEach(([field, length]) => {
  // Pattern: fieldName: { type: 'string' } or fieldName: { type: 'string', format: '...' }
  const pattern1 = new RegExp(`(${field}:\\s*{\\s*type:\\s*'string',?)\\s*}`, 'g');
  const pattern2 = new RegExp(`(${field}:\\s*{\\s*type:\\s*'string',?\\s*format:\\s*'[^']+',?)\\s*}`, 'g');
  
  result = result.replace(pattern1, `$1\n      maxLength: ${length},\n    }`);
  result = result.replace(pattern2, `$1\n      maxLength: ${length},\n    }`);
});

fs.writeFileSync('database/schemas.ts', result);
console.log('✅ Fixed all schemas');
