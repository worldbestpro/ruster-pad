import { useEffect, useState } from "react";
import { set_panic_hook } from "rustpad-wasm";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Select,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { VscAccount, VscCircleFilled, VscRemote } from "react-icons/vsc";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import Rustpad from "./rustpad";
import languages from "./languages.json";

set_panic_hook();

const version = process.env.REACT_APP_SHA
  ? process.env.REACT_APP_SHA.slice(0, 7)
  : "development";

const id = window.location.hash.slice(1);
const wsUri =
  (window.location.origin.startsWith("https") ? "wss://" : "ws://") +
  window.location.host +
  `/api/socket/${id}`;

function App() {
  const toast = useToast();
  const [language, setLanguage] = useState("plaintext");
  const [connection, setConnection] =
    useState<"connected" | "disconnected" | "desynchronized">("disconnected");
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();

  useEffect(() => {
    if (editor) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0); // LF
      const rustpad = new Rustpad({
        uri: wsUri,
        editor,
        onConnected: () => setConnection("connected"),
        onDisconnected: () => setConnection("disconnected"),
        onDesynchronized: () => {
          setConnection("desynchronized");
          toast({
            title: "Desynchronized with server",
            description: "Please save your work and refresh the page.",
            status: "error",
            duration: null,
          });
        },
      });
      return () => rustpad.dispose();
    }
  }, [editor, toast]);

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}/#${id}`);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }

  return (
    <Flex direction="column" h="100vh" overflow="hidden">
      <Box
        flexShrink={0}
        bgColor="#e8e8e8"
        color="#383838"
        textAlign="center"
        fontSize="sm"
        py={0.5}
      >
        Rustpad
      </Box>
      <Flex flex="1 0" minH={0}>
        <Flex direction="column" bgColor="#f3f3f3" w="xs" overflowY="auto">
          <Container maxW="full" lineHeight={1.4} py={4}>
            <HStack spacing={1}>
              <Icon
                as={VscCircleFilled}
                color={
                  {
                    connected: "green.500",
                    disconnected: "orange.500",
                    desynchronized: "red.500",
                  }[connection]
                }
              />
              <Text fontSize="sm" fontStyle="italic" color="gray.600">
                {
                  {
                    connected: "You are connected!",
                    disconnected: "Connecting to the server...",
                    desynchronized: "Disconnected, please refresh.",
                  }[connection]
                }
              </Text>
            </HStack>

            <Heading mt={4} mb={1.5} size="sm">
              Language
            </Heading>
            <Select
              size="sm"
              bgColor="white"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Select>

            <Heading mt={4} mb={1.5} size="sm">
              Share Link
            </Heading>
            <InputGroup size="sm">
              <Input
                readOnly
                pr="3.5rem"
                variant="outline"
                bgColor="white"
                value={`${window.location.origin}/#${id}`}
              />
              <InputRightElement width="3.5rem">
                <Button h="1.4rem" size="xs" onClick={handleCopy}>
                  Copy
                </Button>
              </InputRightElement>
            </InputGroup>

            <Heading mt={4} mb={1.5} size="sm">
              Active Users
            </Heading>
            <Stack mb={1.5} fontSize="sm">
              <HStack p={2} rounded="md" _hover={{ bgColor: "gray.200" }}>
                <Icon as={VscAccount} />
                <Text fontWeight="medium">Anonymous Bear</Text>
                <Text>(you)</Text>
              </HStack>
            </Stack>

            <Heading mt={4} mb={1.5} size="sm">
              About
            </Heading>
            <Text fontSize="sm" mb={1.5}>
              <strong>Rustpad</strong> is an open-source collaborative text
              editor based on the <em>operational transformation</em> algorithm.
            </Text>
            <Text fontSize="sm" mb={1.5}>
              Share a link to this pad with others, and they can edit from their
              browser while seeing your changes in real time.
            </Text>
            <Text fontSize="sm" mb={1.5}>
              Built using Rust and TypeScript. See the{" "}
              <Link
                color="blue.600"
                href="https://github.com/ekzhang/rustpad"
                isExternal
              >
                GitHub repository
              </Link>{" "}
              for details.
            </Text>
          </Container>
        </Flex>
        <Box flex={1} minW={0} h="100%">
          <Editor
            theme="vs"
            language={language}
            options={{
              automaticLayout: true,
              fontSize: 14,
            }}
            onMount={(editor) => setEditor(editor)}
          />
        </Box>
      </Flex>
      <Flex h="22px" bgColor="#0071c3" color="white">
        <Flex
          h="100%"
          bgColor="#09835c"
          pl={2.5}
          pr={4}
          fontSize="sm"
          align="center"
        >
          <Icon as={VscRemote} mb={-0.5} mr={1} />
          <Text fontSize="xs">Rustpad ({version})</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default App;
