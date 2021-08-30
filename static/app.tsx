/// <reference lib="dom" />
import React, { useEffect, useState } from "https://esm.sh/react@17";

const PASSPHRASES_STORAGE = "passphrases";
const storedPassphrases = JSON.parse(
  localStorage.getItem(PASSPHRASES_STORAGE) || "{}"
);

type Participants = Record<string, unknown>;
type SubmitState = "loading" | "error" | "loaded";

const App = () => {
  const [participants, setParticipants] = useState<Participants>({});

  const [participant, setParticipant] = useState<string | null>(null);
  const [participantSubmitState, setParticipantSubmitState] =
    useState<SubmitState>();
  const [participantSubmitError, setParticipantSubmitError] =
    useState<null | Record<string, unknown>>(null);

  const [searchText, setSearchText] = useState<string>("");
  const [editorText, setEditorText] = useState<string>("");
  const [passphrases, setPassphrases] =
    useState<Record<string, string>>(storedPassphrases);

  useEffect(() => {
    (async () => {
      const response = await fetch("/participants");
      const data = await response.json();
      setParticipants(data);
      const name = Object.keys(data)[0];
      if (name) {
        setParticipant(name);
        setEditorText(JSON.stringify(data[name], null, 2));
      }
    })();
  }, []);

  const clickParticipant = (name: string) => {
    setParticipant(name);
    setEditorText(JSON.stringify(participants[name], null, 2));
  };

  const changePassphrase = (name: string, passphrase: string) => {
    const newPassphrases = { ...passphrases, [name]: passphrase };
    setPassphrases(newPassphrases);
    localStorage.setItem(PASSPHRASES_STORAGE, JSON.stringify(newPassphrases));
  };

  const submit = async () => {
    if (participant) {
      const auth = passphrases[participant];
      setParticipantSubmitState("loading");
      setParticipantSubmitError(null);
      const response = await fetch(`/participants/${participant}`, {
        method: "POST",
        headers: auth
          ? {
              "Content-Type": "application/json",
              Authorization: `Basic ${btoa(auth)}`,
            }
          : { "Content-Type": "application/json" },
        body: editorText,
      });
      if (response.status !== 200) {
        setParticipantSubmitState("error");
        setParticipantSubmitError(await response.json());
      } else {
        setParticipantSubmitState("loaded");
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-500 px-2 pb-2 flex flex-col">
      <header className="text-white text-3xl px-4 py-8 font-light">
        Agent Centric Prototyping Service
      </header>
      <div className="rounded-lg w-full flex-grow bg-gray-100 shadow-lg flex">
        <div className="m-4 w-60 flex flex-col">
          <div className="p-4 text-2xl">Participants</div>
          <div>
            <input
              type="text"
              className={`
                mb-4
                rounded-lg
                px-2
                py-2
                h-10
                w-full
                border border-gray-200
                focus:outline-none focus:ring-3 focus:ring-green-400
              `}
              placeholder="Search"
              value={searchText}
              onChange={(ev) => setSearchText(ev.target.value)}
            />
          </div>
          <div
            className={`
              bg-gray-200
              shadow-inner
              rounded-lg
              py-2
              text-gray-700 text-lg
              flex-grow
            `}
          >
            {Object.keys(participants)
              .filter((p) => p.startsWith(searchText))
              .map((name) => (
                <ParticipantSelector
                  name={name}
                  active={name === participant}
                  onClick={() => clickParticipant(name)}
                />
              ))}
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <textarea
            className={`
            flex-grow
            bg-gray-200
            shadow-inner
            rounded-tr-lg rounded-bl-lg
            p-2
            whitespace-pre
            font-mono
            focus:outline-none focus:ring-1 focus:ring-green-400
          `}
            value={editorText}
            onChange={(ev) => setEditorText(ev.target.value)}
          ></textarea>
          <div className="flex py-4 items-center">
            <input
              type="text"
              className={`
                flex-grow
                rounded-lg
                px-2
                py-2
                h-10
                w-full
                border border-gray-200
                focus:outline-none focus:ring-3 focus:ring-green-400
              `}
              value={participant ? passphrases[participant] || "" : ""}
              onChange={
                participant
                  ? (ev) => changePassphrase(participant, ev.target.value)
                  : () => {}
              }
              placeholder="Passphrase"
            />
            <button
              className={`
                rounded-lg
                bg-green-500
                py-2
                px-4
                mx-4
                uppercase
                font-bold
                text-white
                focus:outline-none focus:ring-3 focus:ring-green-400
              `}
              onClick={() => submit()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {participantSubmitError ? (
        <div className="rounded-b-lg bg-gray-800 text-white p-4 mx-4">
          {JSON.stringify(participantSubmitError, null, 2)}
        </div>
      ) : null}
    </div>
  );
};

const ParticipantSelector = ({
  name,
  active,
  onClick,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      className={`pl-4 cursor-pointer ${
        active ? " bg-green-500 text-white" : ""
      }`}
      onClick={onClick}
    >
      {name}
    </div>
  );
};

export default App;
