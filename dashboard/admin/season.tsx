import { AlertDialog, Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import ky from "ky";
import { useState } from "react";
import { adminAccessKeyAtom } from "./state";

export const Season = () => {
  return (
    <div>
      <Text size="2">
        현재 HeyRocket의 정보를 리셋하려면 아래 버튼을 눌러주세요.
      </Text>
      <div>
        <FinishSeason />
      </div>
    </div>
  );
};

const FinishSeason = () => {
  const [nextSeasonName, setNextSeasonName] = useState("");
  const adminAccessKey = useAtomValue(adminAccessKeyAtom);

  const handleReset = () => {
    ky.post("/api/v1/admin/finish-season", {
      headers: {
        "X-Admin-Key": adminAccessKey ?? "",
      },
      json: {
        seasonName: nextSeasonName,
      },
    })
      .then(() => {
        alert("HeyRocket 시즌을 초기화했어요.");
      })
      .catch(() => {
        alert("시즌 초기화에 실패했어요.");
      });
  };

  return (
    <AlertDialog.Root
      onOpenChange={() => {
        setNextSeasonName("");
      }}
    >
      <AlertDialog.Trigger>
        <Button color="red">새 시즌 시작하기</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="500px">
        <AlertDialog.Title>HeyRocket 새 시즌 시작하기</AlertDialog.Title>
        <AlertDialog.Description size="2">
          현재 로켓 수발신 정보를 모두 아카이빙하고, 새로운 HeyRocket 시즌을
          시작합니다.
          <br />
          <br />
          다음 시즌의 이름을 입력해주세요. (예시: 36기)
        </AlertDialog.Description>

        <TextField.Root
          mt="2"
          placeholder="시즌 이름"
          value={nextSeasonName}
          onChange={(e) => setNextSeasonName(e.target.value)}
        />

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              취소
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              disabled={nextSeasonName.length <= 2}
              onClick={handleReset}
            >
              새 시즌 시작하기
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};
