import CONTROLS from "../../data/controls.json";
import { saveImage } from "../../utils";
import { ISetup, UpdateSetupType } from "../../../types";

interface IProps {
  setup: ISetup;
  updateSetup: (event: UpdateSetupType) => void;
  clearPaths: () => void;
}

const Buttons: React.FC<IProps> = ({ setup, updateSetup, clearPaths }) => {
  const saveSetup = () => {
    const filteredSetup = Object.fromEntries(
      Object.entries(setup).filter(([key]) => {
        const entry = CONTROLS.find((item) => item.id === key);
        return entry && !entry.isOmittedInScenario && !entry.isStoringPrevented;
      })
    );
    const customScenariosLength = Object.keys(
      setup.customScenarios || {}
    ).length;
    const newCustomScenarioKey = customScenariosLength + 1;
    const newCustomScenarios = {
      ...setup.customScenarios,
      [newCustomScenarioKey]: filteredSetup
    };
    updateSetup({
      id: "customScenarios",
      value: newCustomScenarios,
      type: "hidden"
    });
  };

  return (
    <>
      <button
        className="control control--button"
        onClick={() => {
          saveImage();
        }}
        title="Save image to your machine"
      >
        Save image
      </button>

      <button
        className="control control--button cancel"
        title="Clear what you've just drawn (you can also wag your finger)"
        onClick={clearPaths}
      >
        Clear image
      </button>

      <button
        className="control control--button cancel"
        title="Reset all settings to defaults"
        onClick={() => {
          sessionStorage.clear();
          window.location.reload();
        }}
      >
        Reset all
      </button>

      <button
        className="control control--button"
        onClick={() => {
          saveSetup();
        }}
        title="Save setup"
      >
        Save setup
      </button>
    </>
  );
};

export default Buttons;
