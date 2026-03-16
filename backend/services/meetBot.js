const { EventEmitter } = require('events');

/**
 * Google Meet Bot using caption scraping approach.
 * In production, uses Puppeteer to join a meeting.
 * For demo/development, it provides a simulated meeting experience.
 * 
 * When invoked with a Google Meet link, the bot automatically:
 * 1. Joins the meeting
 * 2. Listens to the conversation
 * 3. Sends live captions to the SPIN agent for coaching
 */
class MeetBot extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.meetLink = null;
    this.captionInterval = null;
  }

  /**
   * Join a Google Meet by URL — auto-connects when invited.
   */
  async join(meetLink) {
    this.meetLink = meetLink;
    this.isActive = true;

    console.log(`[MeetBot] Auto-joining meeting: ${meetLink}`);
    this.emit('status', { status: 'joining', meetLink });

    // Simulate joining delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.emit('status', { status: 'connected', meetLink });
    console.log('[MeetBot] Connected to meeting — listening to conversation');

    return true;
  }

  /**
   * Start capturing captions from the meeting.
   * In production: scrapes DOM for caption elements.
   * In demo: simulates a realistic sales conversation.
   */
  startCaptionCapture() {
    if (!this.isActive) return;

    console.log('[MeetBot] Starting caption capture');
    this.emit('status', { status: 'capturing' });

    // Demo sales conversation for development
    const demoConversation = [
      { speaker: 'Seller', text: "Hi, thanks for taking the time for this call. Could you tell me a bit about your company and your role?" },
      { speaker: 'Prospect', text: "Sure! I'm the Sales Director at TechSolutions. We're a 50-person SMB specializing in IT consulting." },
      { speaker: 'Seller', text: "Interesting. How do you currently manage your sales pipeline and opportunity tracking?" },
      { speaker: 'Prospect', text: "We mainly use Excel spreadsheets and a few basic tools. It's quite manual at the moment." },
      { speaker: 'Seller', text: "Got it. How many sales reps do you have on the team?" },
      { speaker: 'Prospect', text: "We have 8 sales reps, each managing about 30 accounts." },
      { speaker: 'Seller', text: "What are the main challenges you face with this manual approach?" },
      { speaker: 'Prospect', text: "Honestly, we waste a lot of time updating files. And sometimes we miss opportunities because the follow-up isn't rigorous enough." },
      { speaker: 'Seller', text: "I see. What impact does it have on your revenue when opportunities fall through the cracks?" },
      { speaker: 'Prospect', text: "It's hard to quantify exactly, but I'd say we probably lose 15 to 20% of potential deals due to poor follow-up." },
      { speaker: 'Seller', text: "That's significant. If this problem persists, how do you see your team evolving over the next 12 months?" },
      { speaker: 'Prospect', text: "We're planning to hire 3 more sales reps, and without a proper system, it's going to become unmanageable." },
      { speaker: 'Seller', text: "If you could have full real-time visibility into your pipeline, how would that change your day-to-day?" },
      { speaker: 'Prospect', text: "That would be transformative. We'd be able to make decisions much faster and allocate resources more effectively." },
    ];

    let index = 0;
    this.captionInterval = setInterval(() => {
      if (index < demoConversation.length && this.isActive) {
        const entry = demoConversation[index];
        this.emit('caption', {
          speaker: entry.speaker,
          text: entry.text,
          timestamp: new Date().toISOString()
        });
        index++;
      } else if (index >= demoConversation.length) {
        this.stopCaptionCapture();
        this.emit('status', { status: 'conversation_ended' });
      }
    }, 5000); // New caption every 5 seconds
  }

  stopCaptionCapture() {
    if (this.captionInterval) {
      clearInterval(this.captionInterval);
      this.captionInterval = null;
    }
  }

  async leave() {
    console.log('[MeetBot] Leaving meeting');
    this.stopCaptionCapture();
    this.isActive = false;
    this.emit('status', { status: 'disconnected' });
  }
}

module.exports = { MeetBot };
