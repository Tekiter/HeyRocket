import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { adminAccessKeyAtom } from "./state";
import { useAtom } from "jotai";
import { useState } from "react";
import ky from "ky";
import { Season } from "./season";

const ADMIN_KEY_HEADER = "X-Admin-Key";

export const Admin = () => {
  const [adminKey, setAdminKey] = useAtom(adminAccessKeyAtom);
  const [keyText, setKeyText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = () => {
    ky.get("/api/v1/admin/check", {
      headers: {
        [ADMIN_KEY_HEADER]: keyText,
      },
    })
      .then((res) => {
        setAdminKey(keyText);
      })
      .catch((err) => {
        setError("올바르지 않은 Admin Access Key 입니다.");
      });
  };

  return (
    <Card>
      <Heading>어드민</Heading>

      {adminKey != null ? (
        <Season />
      ) : (
        <>
          <Flex gap="1">
            <TextField.Root
              value={keyText}
              onChange={(e) => setKeyText(e.target.value)}
              placeholder="Admin Access Key"
            />
            <Button onClick={handleAuthorize}>인증</Button>
          </Flex>

          {error && <Text color="red">{error}</Text>}
        </>
      )}
    </Card>
  );
};
