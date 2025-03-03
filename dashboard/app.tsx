import { Admin } from "./admin";
import { Heading, Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";

export const App = () => {
  return (
    <Theme>
      <div>
        <Heading>HeyRocket</Heading>
        <Admin />
      </div>
    </Theme>
  );
};
