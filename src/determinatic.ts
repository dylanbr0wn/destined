import hsluv from "hsluv";

const { hpluvToHex, hsluvToHex } = hsluv;

import { ColorProfiles, Input, InputOptions, OutputOptions } from "./types";

const colorProfiles: ColorProfiles = {
  default: ["husl", 90, 100, 50, 85],
  dark: ["husl", 80, 100, 30, 60],
  light: ["husl", 70, 100, 60, 90],
  pastel: ["huslp", 60, 100, 60, 90],
  wide: ["husl", 50, 100, 30, 85],
  hsldefault: ["hsl", 65, 95, 45, 75],
  superwide: ["hsl", 30, 100, 20, 90],
  saturated: ["hsl", 100, 100, 40, 70],
  greyscale: ["hsl", 0, 0, 15, 85],
};

const defaultOptions: OutputOptions = {
  colorProfile: "default",
  hueCenter: 0,
  hueScale: 1,
  generator: "halton",
  primeWalkHueDistance: 223,
};

function Determinatic(input: Input, inputOptions?: InputOptions) {
  let options: OutputOptions;

  //equivalent to java hashcode implementation
  function _hashCode(key: string) {
    let hash = 0,
      character: number,
      i: number;
    for (i = 0; i < key.length; i++) {
      character = key.charCodeAt(i);
      hash = (hash << 5) - hash + character;
      hash = hash & hash;
    }
    return hash;
  }

  function _getHslComponents(key: Input) {
    let random1: number, random2: number, random3: number;

    if (typeof key === "string") {
      if (!isNaN(Number(key))) {
        key = Number(key);
      } else {
        key = _hashCode(key);
      }
    }

    if (options.generator === "halton") {
      if (key < 0) {
        key = key >>> 0;
      }

      let res: number, f: number, i: number;
      const bases = [3, 5, 7];
      const results: number[] = [];

      for (let j = 0; j < bases.length; j++) {
        res = 0;
        f = 1 / bases[j]!;
        i = key;
        while (i > 0) {
          res = res + f * (i % bases[j]!);
          i = Math.floor(i / bases[j]!);
          f = f / bases[j]!;
        }
        results.push(res);
      }

      random1 = results[0]! * 360;
      random2 = results[1]! * 100;
      random3 = results[2]! * 100;
    } else {
      //repeats exactly every 359*101*103 = 3,734,677

      //167:	~1/2
      //223:	~-1/3	(roughly golden ratio conjugate; 359*.618 = 221.86
      //127:	~1/3
      //97:	~1/4
      //83:	~1/5
      //53:	~1/6
      //29:	~1/12
      //17:	~1/24
      //11:	~1/36

      random1 = ((key * options.primeWalkHueDistance) % 359) * (360 / 359);
      random2 = ((key * 13) % 101) * (100 / 101);
      random3 = ((key * 19) % 103) * (100 / 103);
    }

    //center hue
    if (random1 >= 180) random1 -= 360;

    const profile = colorProfiles[options.colorProfile]!;

    let h = ((random1 % 360) * options.hueScale + options.hueCenter) % 360;

    let s = ((random2 % 100) / 100) * (profile[2] - profile[1]) + profile[1];

    let l = ((random3 % 100) / 100) * (profile[4] - profile[3]) + profile[3];

    if (h < 0) h += 360;
    if (s < 0) s += 100;
    if (l < 0) l += 100;

    return {
      h: h,
      s: s,
      l: l,
    };
  }

  function _init(_options?: InputOptions) {
    const newOptions = { ...defaultOptions, ...(_options ?? {}) };

    const colorProfile = newOptions.colorProfile;

    if (typeof colorProfile === "string") {
      options = {
        ...defaultOptions,
        ...newOptions,
        colorProfile: colorProfile,
      };
    } else {
      colorProfiles["user"] = colorProfile;
      options = { ...defaultOptions, ...newOptions, colorProfile: "user" };
    }
  }

  function _getColorOutput(h: number, s: number, l: number) {
    const profile = colorProfiles[options.colorProfile];

    if (!profile) throw new Error("Color profile not found");

    if (profile[0] === "hsl") {
      return "hsl(" + h + "," + s + "%," + l + "%)";
    } else if (profile[0] === "husl") {
      return hsluvToHex([h, s, l]);
    } else if (profile[0] === "huslp") {
      return hpluvToHex([h, s, l]);
    }
  }
  function _getColor(key: Input) {
    const hsl = _getHslComponents(key);
    return _getColorOutput(hsl.h, hsl.s, hsl.l);
  }
  // function getGradientColors(key: string | number, lightnessSpread?: number) {
  // 	if (lightnessSpread === undefined) {
  // 		lightnessSpread = 30;
  // 	}

  // 	var hsl = _getHslComponents(key);

  // 	return [
  // 		_getColorOutput(hsl.h, hsl.s, Math.min(100, hsl.l + lightnessSpread / 2)),
  // 		_getColorOutput(hsl.h, hsl.s, Math.max(0, hsl.l - lightnessSpread / 2)),
  // 	];
  // }

  _init(inputOptions);
  return _getColor(input);
}

export default Determinatic;