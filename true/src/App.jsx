import React, { useEffect, useState } from "react";
import { getPolls, createPoll, voteOption } from "./api";

function App() {
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState(["", ""]);

  // -----------------------------
  // Load polls
  // -----------------------------
  function loadPolls() {
    const run = async () => {
      try {
        const data = await getPolls();
        setPolls(data);
      } catch (error) {
        console.error("Error loading polls:", error);
      }
    };
    run();
  }

  useEffect(() => {
    loadPolls();
  }, []);

  // -----------------------------
  // Option handlers
  // -----------------------------
  function updateOption(index, value) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  // -----------------------------
  // Create poll
  // -----------------------------
  async function handleCreatePoll(e) {
    e.preventDefault();

    // Validate question
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }

    // Validate options
    const cleanedOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (cleanedOptions.length < 2) {
      alert("Please enter at least 2 options.");
      return;
    }

    const payload = {
      question: question.trim(),
      allow_multiple: allowMultiple,
      options: cleanedOptions,
    };

    try {
      await createPoll(payload);

      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setAllowMultiple(false);

      loadPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
    }
  }

  // -----------------------------
  // Vote
  // -----------------------------
  async function handleVote(optionId) {
    try {
      await voteOption(optionId);
      loadPolls();
    } catch (error) {
      console.error("Error voting:", error);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Create Poll */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-3">Create Poll</h2>

        <form onSubmit={handleCreatePoll} className="space-y-4">
          {/* QUESTION */}
          <input
            className="w-full border p-2 rounded"
            placeholder="Enter question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />

          {/* MULTIPLE CHOICE */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
            />
            <span>Allow multiple answers</span>
          </label>

          {/* OPTIONS */}
          <div>
            <h3 className="font-semibold mb-2">Options</h3>

            {options.map((opt, idx) => (
              <input
                key={idx}
                className="w-full border p-2 rounded mb-2"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                required
              />
            ))}

            <button
              type="button"
              onClick={addOption}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Add Option
            </button>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded w-full"
            type="submit"
          >
            Create Poll
          </button>
        </form>
      </div>

      {/* POLL LIST */}
      <h2 className="text-xl font-bold mb-3">All Polls</h2>

      {polls.map((poll) => (
        <div key={poll.id} className="bg-white p-4 rounded shadow mb-4">
          <h3 className="text-lg font-bold">{poll.question}</h3>

          <p className="text-sm text-gray-500 mb-3">
            {poll.allow_multiple ? "Multiple choice" : "Single choice"}
          </p>

          {poll.results?.map((option) => {
            const percent =
              poll.total_votes === 0
                ? 0
                : Math.round((option.votes / poll.total_votes) * 100);

            return (
              <div key={option.id} className="mb-3">
                <div className="flex justify-between">
                  <span>{option.text}</span>
                  <span>{option.votes} votes ({percent}%)</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <button
                  onClick={() => handleVote(option.id)}
                  className="mt-2 px-4 py-1 bg-green-600 text-white rounded"
                >
                  Vote
                </button>
              </div>
            );
          })}

          <p className="text-sm text-gray-600">
            Total Votes: {poll.total_votes}
          </p>
        </div>
      ))}
    </div>
  );
}

export default App;





