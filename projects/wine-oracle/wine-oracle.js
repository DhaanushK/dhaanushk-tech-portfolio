(() => {
  const form = document.querySelector("#wine-predict-form");
  if (!form) return;

  const wineType = document.querySelector("#wo-wine-type");
  const exampleButton = document.querySelector("#wo-example");
  const clearButton = document.querySelector("#wo-clear");
  const submitButton = document.querySelector("#wo-submit");
  const status = document.querySelector("#wo-status");
  const result = document.querySelector("#wo-result");
  const fields = [...form.querySelectorAll(".wo-field input")];
  const scriptPromises = new Map();
  const exampleOrder = { red: [], white: [] };
  const lastExample = { red: -1, white: -1 };
  const ratingMeanings = {
    red: {
      3: "Sensory rating 3 is the lowest class the red wine model learned.",
      4: "Sensory rating 4 is two points below the higher-quality cutoff of 6.",
      5: "Sensory rating 5 is one point below the higher-quality cutoff of 6.",
      6: "Sensory rating 6 meets the higher-quality cutoff.",
      7: "Sensory rating 7 is one point above the higher-quality cutoff.",
      8: "Sensory rating 8 is the highest class the red wine model learned.",
    },
    white: {
      3: "Sensory rating 3 is the lowest class the white wine model learned.",
      4: "Sensory rating 4 is two points below the higher-quality cutoff of 6.",
      5: "Sensory rating 5 is one point below the higher-quality cutoff of 6.",
      6: "Sensory rating 6 meets the higher-quality cutoff.",
      7: "Sensory rating 7 is one point above the higher-quality cutoff.",
      8: "Sensory rating 8 is two points above the higher-quality cutoff.",
      9: "Sensory rating 9 is the highest class the white wine model learned.",
    },
  };
  let inferenceAssetsPromise;

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  function loadScript(path) {
    const source = new URL(path, document.baseURI).href;
    if (scriptPromises.has(source)) return scriptPromises.get(source);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        scriptPromises.delete(source);
        reject(new Error("A browser model file could not be loaded."));
      };
      document.head.append(script);
    });
    scriptPromises.set(source, promise);
    return promise;
  }

  function loadInferenceAssets() {
    if (!inferenceAssetsPromise) {
      inferenceAssetsPromise = (async () => {
        await loadScript("demo/tf.min.js");
        if (!window.tf) throw new Error("TensorFlow.js did not initialize in this browser.");
        await window.tf.setBackend("cpu");
        await window.tf.ready();
        await loadScript("demo/model-data.js");
        await loadScript("demo/wine-oracle-inference.js");
        if (typeof window.WINE_ORACLE_PREDICT !== "function") {
          throw new Error("The browser prediction code did not initialize.");
        }
      })().catch((error) => {
        inferenceAssetsPromise = null;
        throw error;
      });
    }
    return inferenceAssetsPromise;
  }

  function shuffledExampleIndex(wine) {
    const samples = window.WINE_ORACLE_EXAMPLES?.[wine];
    if (!Array.isArray(samples) || samples.length === 0) {
      throw new Error("Random example samples are unavailable. Refresh the page and try again.");
    }
    if (exampleOrder[wine].length === 0) {
      exampleOrder[wine] = Array.from({ length: samples.length }, (_, index) => index);
      for (let index = exampleOrder[wine].length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [exampleOrder[wine][index], exampleOrder[wine][swap]] = [exampleOrder[wine][swap], exampleOrder[wine][index]];
      }
      const last = exampleOrder[wine].length - 1;
      if (samples.length > 1 && exampleOrder[wine][last] === lastExample[wine]) {
        [exampleOrder[wine][last], exampleOrder[wine][last - 1]] = [exampleOrder[wine][last - 1], exampleOrder[wine][last]];
      }
    }
    const index = exampleOrder[wine].pop();
    lastExample[wine] = index;
    return samples[index];
  }

  function fillExample() {
    let sample;
    try {
      sample = shuffledExampleIndex(wineType.value);
    } catch (error) {
      setStatus(error.message, "error");
      return;
    }
    fields.forEach((input) => {
      input.value = sample[input.name];
    });
    result.hidden = true;
    const wineLabel = wineType.value === "red" ? "red" : "white";
    setStatus(`A new ${wineLabel} sample was randomly selected from the project data. Edit it if you want, then run a prediction.`);
  }

  exampleButton.addEventListener("click", fillExample);
  clearButton.addEventListener("click", () => {
    fields.forEach((input) => { input.value = ""; });
    result.hidden = true;
    setStatus("Measurements cleared.");
    fields[0].focus();
  });
  wineType.addEventListener("change", () => {
    result.hidden = true;
    setStatus("Wine type changed. Load its example values or enter a new sample.");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = fields.map((input) => Number(input.value));
    const selectedWine = wineType.value;
    if (values.some((value) => !Number.isFinite(value))) {
      setStatus("Enter a finite numeric value for every measurement.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    [wineType, exampleButton, clearButton, ...fields].forEach((control) => {
      control.disabled = true;
    });
    result.hidden = true;
    setStatus("Loading the model into your browser. The first prediction may take a few seconds.");

    try {
      await loadInferenceAssets();
      setStatus("Running the prediction locally in your browser.");
      const prediction = await window.WINE_ORACLE_PREDICT(selectedWine, values);
      document.querySelector("#wo-quality").textContent = `${prediction.quality}`;
      document.querySelector("#wo-tier").textContent = prediction.qualityTier;
      document.querySelector("#wo-probability-label").textContent = `Model probability for rating ${prediction.quality}`;
      document.querySelector("#wo-probability").textContent = `${(prediction.probability * 100).toFixed(1)}%`;
      document.querySelector("#wo-rating-meaning").textContent = ratingMeanings[selectedWine][prediction.quality]
        || `The ${selectedWine} wine model predicts this sensory quality rating from the lab measurements.`;
      result.hidden = false;
      setStatus("Prediction complete. Your measurements were processed in this browser.");
    } catch (error) {
      setStatus(error.message || "The browser model could not complete this prediction.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      [wineType, exampleButton, clearButton, ...fields].forEach((control) => {
        control.disabled = false;
      });
    }
  });
})();
