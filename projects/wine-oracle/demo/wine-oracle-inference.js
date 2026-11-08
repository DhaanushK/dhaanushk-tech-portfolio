(() => {
  const FEATURES = [
    "fixed acidity",
    "volatile acidity",
    "citric acid",
    "residual sugar",
    "chlorides",
    "free sulfur dioxide",
    "total sulfur dioxide",
    "density",
    "pH",
    "sulphates",
    "alcohol",
  ];
  const models = Object.create(null);

  function tensorFrom(entry) {
    const binary = atob(entry.data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return tf.tensor(new Float32Array(bytes.buffer), entry.shape, "float32");
  }

  function createBranch(input, layerNames) {
    let value = tf.layers.conv1d({
      filters: 32,
      kernelSize: 2,
      activation: "relu",
      padding: "same",
      name: layerNames.convA,
    }).apply(input);
    value = tf.layers.maxPooling1d({ poolSize: 2, name: layerNames.poolA }).apply(value);
    value = tf.layers.conv1d({
      filters: 64,
      kernelSize: 2,
      activation: "relu",
      padding: "same",
      name: layerNames.convB,
    }).apply(value);
    value = tf.layers.maxPooling1d({ poolSize: 2, name: layerNames.poolB }).apply(value);
    return tf.layers.flatten({ name: layerNames.flatten }).apply(value);
  }

  function createCombinedModel(data) {
    const leftInput = tf.input({ shape: [data.split, 1], name: "input_layer" });
    const rightInput = tf.input({
      shape: [data.features.length - data.split, 1],
      name: "input_layer_1",
    });
    const mlpInput = tf.input({ shape: [data.classes.length], name: "mlp_probabilities" });
    const leftBranch = createBranch(leftInput, {
      convA: "conv1d",
      poolA: "max_pooling1d",
      convB: "conv1d_1",
      poolB: "max_pooling1d_1",
      flatten: "flatten",
    });
    const rightBranch = createBranch(rightInput, {
      convA: "conv1d_2",
      poolA: "max_pooling1d_2",
      convB: "conv1d_3",
      poolB: "max_pooling1d_3",
      flatten: "flatten_1",
    });
    let cnn = tf.layers.concatenate({ name: "concatenate" }).apply([leftBranch, rightBranch]);
    cnn = tf.layers.dense({ units: 256, activation: "relu", name: "dense" }).apply(cnn);
    cnn = tf.layers.dropout({ rate: 0.5, name: "dropout" }).apply(cnn);
    cnn = tf.layers.dense({ units: 128, activation: "relu", name: "dense_1" }).apply(cnn);
    cnn = tf.layers.dropout({ rate: 0.5, name: "dropout_1" }).apply(cnn);
    cnn = tf.layers.dense({ units: 64, activation: "relu", name: "dense_2" }).apply(cnn);
    cnn = tf.layers.dropout({ rate: 0.5, name: "dropout_2" }).apply(cnn);
    cnn = tf.layers.dense({ units: data.classes.length, activation: "softmax", name: "dense_3" }).apply(cnn);
    let combined = tf.layers.concatenate({ name: "concatenate_1" }).apply([cnn, mlpInput]);
    combined = tf.layers.dense({ units: 128, activation: "relu", name: "dense_4" }).apply(combined);
    combined = tf.layers.dropout({ rate: 0.5, name: "dropout_3" }).apply(combined);
    combined = tf.layers.dense({ units: 64, activation: "relu", name: "dense_5" }).apply(combined);
    combined = tf.layers.dropout({ rate: 0.5, name: "dropout_4" }).apply(combined);
    combined = tf.layers.dense({ units: 32, activation: "relu", name: "dense_6" }).apply(combined);
    combined = tf.layers.dropout({ rate: 0.5, name: "dropout_5" }).apply(combined);
    const output = tf.layers.dense({ units: data.classes.length, activation: "softmax", name: "dense_7" }).apply(combined);
    const model = tf.model({ inputs: [leftInput, rightInput, mlpInput], outputs: output });

    Object.entries(data.combinedWeights).forEach(([name, encodedWeights]) => {
      const weights = encodedWeights.map(tensorFrom);
      model.getLayer(name).setWeights(weights);
      weights.forEach((weight) => weight.dispose());
    });
    return model;
  }

  function loadWineModel(wineType) {
    if (models[wineType]) return models[wineType];
    const data = window.WINE_ORACLE_MODELS?.[wineType];
    if (!data) throw new Error(`The ${wineType} wine model data is unavailable.`);
    const model = createCombinedModel(data);
    models[wineType] = {
      data,
      model,
      mlpCoefs: data.mlp.coefs.map(tensorFrom),
      mlpBiases: data.mlp.intercepts.map(tensorFrom),
    };
    return models[wineType];
  }

  function transformInput(data, values) {
    if (!Array.isArray(values) || values.length !== FEATURES.length) {
      throw new Error("Enter all 11 wine measurements before predicting.");
    }
    values.forEach((value) => {
      if (!Number.isFinite(value)) throw new Error("Every measurement must be a finite number.");
    });

    const rawTransform = data.rawInputTransform;
    const scaledFeatures = {};
    FEATURES.forEach((name, index) => {
      const value = values[index];
      if (rawTransform.method === "minmax") {
        scaledFeatures[name] = (value - rawTransform.min[name])
          / (rawTransform.max[name] - rawTransform.min[name]);
      } else {
        scaledFeatures[name] = (value - rawTransform.mean[name]) / rawTransform.scale[name];
      }
    });

    const ordered = data.features.map((name) => (
      name === "alcohol_sulphate_interaction"
        ? scaledFeatures.alcohol * scaledFeatures.sulphates
        : scaledFeatures[name]
    ));
    return Float32Array.from(ordered, (value, index) => {
      const centered = Math.fround(value - data.scaler.mean[index]);
      return Math.fround(centered / data.scaler.scale[index]);
    });
  }

  function predictMlp(scaled, coefs, biases) {
    return tf.tidy(() => {
      let value = tf.tensor2d(scaled, [1, scaled.length]);
      coefs.forEach((weights, index) => {
        value = tf.matMul(value, weights).add(biases[index]);
        value = index === coefs.length - 1 ? tf.softmax(value) : tf.relu(value);
      });
      return value;
    });
  }

  async function predict(wineType, values) {
    await tf.ready();
    const { data, model, mlpCoefs, mlpBiases } = loadWineModel(wineType);
    const scaled = transformInput(data, values);
    const mlpProbabilities = predictMlp(scaled, mlpCoefs, mlpBiases);
    const split = data.split;
    const left = tf.tensor3d(scaled.slice(0, split), [1, split, 1]);
    const right = tf.tensor3d(scaled.slice(split), [1, scaled.length - split, 1]);
    const probabilities = model.predict([left, right, mlpProbabilities]);
    try {
      const output = await probabilities.data();
      let selected = 0;
      for (let index = 1; index < output.length; index += 1) {
        if (output[index] > output[selected]) selected = index;
      }
      const quality = data.classes[selected];
      return {
        quality,
        probability: output[selected],
        qualityTier: quality >= 6 ? "Higher predicted quality" : "Lower predicted quality",
        runtime: tf.getBackend(),
      };
    } finally {
      tf.dispose([left, right, mlpProbabilities, probabilities]);
    }
  }

  window.WINE_ORACLE_PREDICT = predict;
})();
