import { describe, it, expect } from "vitest";
import { betResultEmailHtml, commentReplyEmailHtml } from "../email";

describe("betResultEmailHtml", () => {
  it("generates win email containing the user's name", () => {
    const html = betResultEmailHtml({
      userName: "Kelly",
      eventTitle: "Will BTC hit 200k?",
      won: true,
      payout: 500,
      link: "/predict/123",
    });
    expect(html).toContain("Kelly");
  });

  it("generates win email containing 'You won'", () => {
    const html = betResultEmailHtml({
      userName: "Kelly",
      eventTitle: "Will BTC hit 200k?",
      won: true,
      payout: 500,
      link: "/predict/123",
    });
    expect(html).toContain("You won");
  });

  it("includes the payout amount when won with payout", () => {
    const html = betResultEmailHtml({
      userName: "Kelly",
      eventTitle: "Will BTC hit 200k?",
      won: true,
      payout: 500,
      link: "/predict/123",
    });
    expect(html).toContain("500 points");
  });

  it("includes the event title in the email body", () => {
    const html = betResultEmailHtml({
      userName: "Kelly",
      eventTitle: "Will BTC hit 200k?",
      won: true,
      payout: 500,
      link: "/predict/123",
    });
    expect(html).toContain("BTC hit 200k");
  });

  it("generates a loss email with 'Better luck' text", () => {
    const html = betResultEmailHtml({
      userName: "Bob",
      eventTitle: "Test Event",
      won: false,
      link: "/predict/456",
    });
    expect(html).toContain("Better luck");
  });

  it("does not contain 'You won' for a loss", () => {
    const html = betResultEmailHtml({
      userName: "Bob",
      eventTitle: "Test Event",
      won: false,
      link: "/predict/456",
    });
    expect(html).not.toContain("You won");
  });

  it("includes win text without payout when payout is not provided", () => {
    const html = betResultEmailHtml({
      userName: "Alice",
      eventTitle: "Test Event",
      won: true,
      link: "/predict/789",
    });
    expect(html).toContain("You won");
    expect(html).not.toContain("undefined");
  });

  it("includes the link in the email", () => {
    const html = betResultEmailHtml({
      userName: "Alice",
      eventTitle: "Test Event",
      won: true,
      link: "/predict/999",
    });
    expect(html).toContain("/predict/999");
  });

  it("escapes HTML in userName to prevent XSS", () => {
    const html = betResultEmailHtml({
      userName: "<script>alert('xss')</script>",
      eventTitle: "Normal Title",
      won: true,
      link: "/",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in eventTitle", () => {
    const html = betResultEmailHtml({
      userName: "Bob",
      eventTitle: '<img src=x onerror="alert(1)">',
      won: false,
      link: "/",
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("escapes double-quotes in user-supplied strings", () => {
    const html = betResultEmailHtml({
      userName: 'Say "hello"',
      eventTitle: "Normal",
      won: true,
      link: "/",
    });
    expect(html).toContain("&quot;hello&quot;");
  });

  it("uses fallback name 'there' when userName is empty string", () => {
    const html = betResultEmailHtml({
      userName: "",
      eventTitle: "Normal",
      won: true,
      link: "/",
    });
    expect(html).toContain("there");
  });
});

describe("commentReplyEmailHtml", () => {
  it("generates email containing the recipient's name", () => {
    const html = commentReplyEmailHtml({
      userName: "Kelly",
      commenterName: "Alice",
      eventTitle: "Some Event",
      comment: "Great prediction!",
      link: "/predict/789",
    });
    expect(html).toContain("Kelly");
  });

  it("includes the commenter's name", () => {
    const html = commentReplyEmailHtml({
      userName: "Kelly",
      commenterName: "Alice",
      eventTitle: "Some Event",
      comment: "Great prediction!",
      link: "/predict/789",
    });
    expect(html).toContain("Alice");
  });

  it("includes the comment text", () => {
    const html = commentReplyEmailHtml({
      userName: "Kelly",
      commenterName: "Alice",
      eventTitle: "Some Event",
      comment: "Great prediction!",
      link: "/predict/789",
    });
    expect(html).toContain("Great prediction!");
  });

  it("includes the event title", () => {
    const html = commentReplyEmailHtml({
      userName: "Kelly",
      commenterName: "Alice",
      eventTitle: "Some Event",
      comment: "Great prediction!",
      link: "/predict/789",
    });
    expect(html).toContain("Some Event");
  });

  it("includes the link", () => {
    const html = commentReplyEmailHtml({
      userName: "Kelly",
      commenterName: "Alice",
      eventTitle: "Some Event",
      comment: "Any comment",
      link: "/predict/789",
    });
    expect(html).toContain("/predict/789");
  });

  it("escapes HTML in commenterName", () => {
    const html = commentReplyEmailHtml({
      userName: "Bob",
      commenterName: "<b>Hacker</b>",
      eventTitle: "Event",
      comment: "msg",
      link: "/",
    });
    expect(html).not.toContain("<b>Hacker</b>");
    expect(html).toContain("&lt;b&gt;Hacker&lt;/b&gt;");
  });

  it("escapes HTML in the comment text", () => {
    const html = commentReplyEmailHtml({
      userName: "Bob",
      commenterName: "Alice",
      eventTitle: "Event",
      comment: "<script>evil()</script>",
      link: "/",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in eventTitle", () => {
    const html = commentReplyEmailHtml({
      userName: "Bob",
      commenterName: "Alice",
      eventTitle: "<marquee>win?</marquee>",
      comment: "msg",
      link: "/",
    });
    expect(html).not.toContain("<marquee>");
    expect(html).toContain("&lt;marquee&gt;");
  });
});
