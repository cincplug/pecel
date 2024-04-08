const Controls = ({ controls, setup, handleInputChange }) =>
  controls.map((item, index) => {
    const { id, type, min, max, step, title, description, options } = item;
    let value = setup[id];
    const checked = value === true;

    const inputValue = type === "color" && !value ? "#000000" : value || "";

    const inputProps = {
      className: "control__input",
      type,
      id,
      min,
      max,
      step,
      value: inputValue,
      onChange: handleInputChange,
    };

    if (type === "checkbox") {
      inputProps.checked = checked;
    }

    return (
      <div
        className={`control control--${type} control--${id}`}
        key={`${id}-${index}`}
        title={description}
      >
        {type === "select" ? (
          <select
            className="control__select"
            {...{ value, id }}
            onChange={(event) => {
              handleInputChange(event);
            }}
          >
            {options.map((option, optionIndex) => (
              <option key={optionIndex} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input {...inputProps} />
        )}
        <label className="control__label" htmlFor={id}>
          <span className="text">{title}</span>
          {type === "range" && <span className="value">{value}</span>}
        </label>
      </div>
    );
  });

export default Controls;
