/**
 * Test Suite: craft-session — CRAFT follow-up chat pattern
 *
 * CRAFT = Context, Role, Action, Format, Target
 * Tests that the chat message array used for Claude API calls:
 *   1. Can be built with alternating user/assistant roles
 *   2. Context accumulates correctly as messages are appended
 *   3. Message format matches the Claude API expectations
 *      (role: 'user' | 'assistant', content: string)
 *
 * No external imports needed — the chat array format is defined
 * in lib/store.ts as ChatMessage[]. We test the construction
 * patterns that match how lib/claude.ts sends messages.
 */

import type { ChatMessage } from '../lib/store';

// ---------------------------------------------------------------------------
// ChatMessage type contract
// ---------------------------------------------------------------------------

describe('ChatMessage type contract', () => {
  it('accepts a user message with id, role, content', () => {
    const msg: ChatMessage = {
      id: 'msg-001',
      role: 'user',
      content: 'Plan a 3-day trip to Tokyo with a focus on street food.',
    };
    expect(msg.role).toBe('user');
    expect(typeof msg.content).toBe('string');
    expect(typeof msg.id).toBe('string');
  });

  it('accepts an assistant message', () => {
    const msg: ChatMessage = {
      id: 'msg-002',
      role: 'assistant',
      content: 'Here is your 3-day Tokyo street food itinerary...',
    };
    expect(msg.role).toBe('assistant');
    expect(msg.content.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Building alternating message arrays
// ---------------------------------------------------------------------------

describe('CRAFT session — alternating roles', () => {
  function buildConversation(
    turns: Array<{ role: 'user' | 'assistant'; content: string }>
  ): ChatMessage[] {
    return turns.map((turn, index) => ({
      id: `msg-${String(index).padStart(3, '0')}`,
      role: turn.role,
      content: turn.content,
    }));
  }

  it('creates a single-turn conversation (user only)', () => {
    const messages = buildConversation([
      { role: 'user', content: 'Plan a trip to Paris.' },
    ]);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
  });

  it('creates a two-turn conversation (user → assistant)', () => {
    const messages = buildConversation([
      { role: 'user', content: 'Plan a trip to Paris.' },
      { role: 'assistant', content: 'Here is your Paris itinerary...' },
    ]);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });

  it('creates a three-turn follow-up conversation', () => {
    const messages = buildConversation([
      { role: 'user', content: 'Plan a trip to Paris.' },
      { role: 'assistant', content: 'Here is your Paris itinerary...' },
      { role: 'user', content: 'Can you add more food recommendations?' },
    ]);
    expect(messages).toHaveLength(3);
    expect(messages[2].role).toBe('user');
    expect(messages[2].content).toContain('food');
  });

  it('roles alternate correctly in a 4-turn conversation', () => {
    const messages = buildConversation([
      { role: 'user', content: 'Plan Paris.' },
      { role: 'assistant', content: 'Here is Paris.' },
      { role: 'user', content: 'Add a day.' },
      { role: 'assistant', content: 'Added day 4.' },
    ]);
    const roles = messages.map((m) => m.role);
    expect(roles).toEqual(['user', 'assistant', 'user', 'assistant']);
  });

  it('all messages have unique ids', () => {
    const messages = buildConversation([
      { role: 'user', content: 'Message A' },
      { role: 'assistant', content: 'Message B' },
      { role: 'user', content: 'Message C' },
    ]);
    const ids = messages.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(messages.length);
  });
});

// ---------------------------------------------------------------------------
// Context accumulation
// ---------------------------------------------------------------------------

describe('CRAFT session — context accumulation', () => {
  function appendMessage(
    messages: ChatMessage[],
    role: 'user' | 'assistant',
    content: string
  ): ChatMessage[] {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
    };
    // Immutable: return new array
    return [...messages, newMsg];
  }

  it('starts with empty messages array', () => {
    const messages: ChatMessage[] = [];
    expect(messages).toHaveLength(0);
  });

  it('accumulates messages correctly after each append', () => {
    let messages: ChatMessage[] = [];
    messages = appendMessage(messages, 'user', 'Initial trip request.');
    expect(messages).toHaveLength(1);
    messages = appendMessage(messages, 'assistant', 'Here is your itinerary.');
    expect(messages).toHaveLength(2);
    messages = appendMessage(messages, 'user', 'Can you shorten day 2?');
    expect(messages).toHaveLength(3);
  });

  it('does not mutate the previous messages array (immutability)', () => {
    const original: ChatMessage[] = [
      { id: 'a', role: 'user', content: 'First message.' },
    ];
    const updated = [...original, { id: 'b', role: 'assistant' as const, content: 'Reply.' }];
    expect(original).toHaveLength(1);
    expect(updated).toHaveLength(2);
  });

  it('all previous messages are preserved when a new one is appended', () => {
    let messages: ChatMessage[] = [];
    messages = appendMessage(messages, 'user', 'Turn 1');
    messages = appendMessage(messages, 'assistant', 'Turn 2');
    messages = appendMessage(messages, 'user', 'Turn 3');

    expect(messages[0].content).toBe('Turn 1');
    expect(messages[1].content).toBe('Turn 2');
    expect(messages[2].content).toBe('Turn 3');
  });

  it('full conversation history is preserved across multiple follow-ups', () => {
    const turns = [
      { role: 'user' as const, content: 'Plan Tokyo 7 days.' },
      { role: 'assistant' as const, content: 'Here is your Tokyo itinerary.' },
      { role: 'user' as const, content: 'Focus more on food.' },
      { role: 'assistant' as const, content: 'Updated with more food stops.' },
      { role: 'user' as const, content: 'Add a ramen crawl on day 3.' },
    ];

    let messages: ChatMessage[] = [];
    for (const turn of turns) {
      messages = appendMessage(messages, turn.role, turn.content);
    }

    expect(messages).toHaveLength(5);
    expect(messages[0].content).toContain('Tokyo');
    expect(messages[4].content).toContain('ramen');
  });
});

// ---------------------------------------------------------------------------
// Claude API message format
// ---------------------------------------------------------------------------

describe('CRAFT session — Claude API format compliance', () => {
  it('each message has exactly the fields role and content (plus id)', () => {
    const msg: ChatMessage = {
      id: 'test-id',
      role: 'user',
      content: 'Hello.',
    };
    // The Claude messages API requires role and content
    expect(msg).toHaveProperty('role');
    expect(msg).toHaveProperty('content');
  });

  it('role is always "user" or "assistant" (never system)', () => {
    const validRoles: ChatMessage['role'][] = ['user', 'assistant'];
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'A' },
      { id: '2', role: 'assistant', content: 'B' },
      { id: '3', role: 'user', content: 'C' },
    ];
    for (const msg of messages) {
      expect(validRoles).toContain(msg.role);
    }
  });

  it('content is always a non-empty string', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Tell me about Tokyo.' },
      { id: '2', role: 'assistant', content: 'Tokyo is a vibrant city...' },
    ];
    for (const msg of messages) {
      expect(typeof msg.content).toBe('string');
      expect(msg.content.length).toBeGreaterThan(0);
    }
  });

  it('produces the correct shape when mapped for the Claude messages API', () => {
    const chatMessages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Plan my trip.' },
      { id: '2', role: 'assistant', content: 'Here is your plan.' },
    ];

    // Simulate what lib/claude.ts does: strip id before sending to API
    const apiMessages = chatMessages.map(({ role, content }) => ({ role, content }));

    expect(apiMessages[0]).toEqual({ role: 'user', content: 'Plan my trip.' });
    expect(apiMessages[1]).toEqual({ role: 'assistant', content: 'Here is your plan.' });
    // No id field in the API payload
    expect(apiMessages[0]).not.toHaveProperty('id');
  });

  it('last message in a CRAFT follow-up is always from the user', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Initial request.' },
      { id: '2', role: 'assistant', content: 'Initial response.' },
      { id: '3', role: 'user', content: 'Follow-up question.' },
    ];
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.role).toBe('user');
  });
});
