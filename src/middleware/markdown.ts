import { Request, Response, NextFunction } from "express";

export const markdownNegotiation = (req: Request, res: Response, next: NextFunction) => {
  const accept = req.headers.accept;

  if (accept && accept.includes("text/markdown")) {
    const originalJson = res.json;
    const originalSend = res.send;

    // Override json to return markdown if requested
    res.json = function (data: any) {
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("x-markdown-tokens", "true");
      
      let markdown = "";
      if (typeof data === "object") {
        markdown = "```json\n" + JSON.stringify(data, null, 2) + "\n```";
      } else {
        markdown = String(data);
      }
      
      return originalSend.call(this, markdown);
    };

    // Also override send for string responses
    res.send = function (body: any) {
      if (typeof body === "string" && !res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "text/markdown");
      }
      return originalSend.call(this, body);
    };
  }

  next();
};
