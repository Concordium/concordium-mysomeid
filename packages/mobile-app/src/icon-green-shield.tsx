import * as React from "react"
import Svg, { G, Path } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props: any) => (
  <Svg width={63} height={74} xmlns="http://www.w3.org/2000/svg" {...props}>
    <G fillRule="nonzero" fill="none">
      <Path
        d="M31.5 9 8 19.182v15.273C8 48.582 18.027 61.793 31.5 65 44.973 61.793 55 48.582 55 34.455V19.182L31.5 9Z"
        stroke="#FFF"
        strokeWidth={16}
        fill="#FFF"
      />
      <Path
        d="M31.5 9 8 19.182v15.273C8 48.582 18.027 61.793 31.5 65 44.973 61.793 55 48.582 55 34.455V19.182L31.5 9Z"
        stroke="#1E2246"
        strokeWidth={6}
        fill="#96FFC0"
      />
      <Path
        fill="#1D2043"
        d="m29.339 50.87-12.016-8.156 2.968-4.109 7.776 5.256 13.87-19.202 4.241 2.9z"
      />
    </G>
  </Svg>
)

export default SvgComponent

