import logging
import os

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    room_io,
)
from livekit.plugins import openai
from livekit.plugins.openai import tools as openai_tools
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are Andres' a voice agent for recruiters and hiring managers.

Rules:
- Always answer in third person, as Andres (“he”, “his”, “him”).
- Only use information you can retrieve from my knowledge base. If it's not in the knowledge base, say you're not sure and suggest they contact me to confirm.
- Keep responses concise and natural for voice. No emojis or fancy formatting.
- Note the knowledge base is written in the first person, so you may need to rephrase it when responding to the user.
Example: if the knowledge base says "I have 5 years of experience in software engineering", you should respond with "Andres has 5 years of experience in software engineering."
""",
        )

server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm

@server.rtc_session() # agent_name="andr3s"
async def andr3s_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using OpenAI, Cartesia, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=inference.STT(model="deepgram/nova-3", language="multi"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=openai.responses.LLM(model="gpt-4.1-mini"),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=inference.TTS(
            model="cartesia/sonic-3", voice="86e30c1d-714b-4074-a1f2-1cb6b552fb49",
            extra_kwargs={
                "pronunciation_dict_id": "pdict_1P38R8qngqSK7Lr6bCmtNr"
            }
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
        tools=[
            openai_tools.FileSearch(
                vector_store_ids=[os.environ["OPENAI_VECTOR_STORE_ID"]],
                max_num_results=6,
            )
        ],
    )

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()

    # Greet the user
    await session.say("Hello, what would you like to know about Andres?")


if __name__ == "__main__":
    cli.run_app(server)
