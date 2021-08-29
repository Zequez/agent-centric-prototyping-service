import { Processor } from "https://esm.sh/windicss/lib";
import { HTMLParser } from "https://esm.sh/windicss/utils/parser";

export function generateStyles(html: string) {
  // Get windi processor
  const processor = new Processor();

  // Parse all classes and put into one line to simplify operations
  const htmlClasses = new HTMLParser(html)
    .parseClasses()
    .map((i) => i.result)
    .join(" ");

  console.log(htmlClasses);

  // Generate preflight based on the html we input
  const preflightSheet = processor.preflight(html);

  // Process the html classes to an interpreted style sheet
  const interpretedSheet = processor.interpret(htmlClasses).styleSheet;

  // Build styles
  const APPEND = false;
  const MINIFY = false;
  const styles = interpretedSheet.extend(preflightSheet, APPEND).build(MINIFY);

  return styles;
}
