import * as React from "react"
import Svg, { G, Path, Circle } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props) => (
  <Svg width={63} height={74} xmlns="http://www.w3.org/2000/svg" {...props}>
    <G fill="none" fillRule="evenodd">
      <Path
        d="M31.5 9 8 19.182v15.273C8 48.582 18.027 61.793 31.5 65 44.973 61.793 55 48.582 55 34.455V19.182L31.5 9Z"
        stroke="#FFF"
        strokeWidth={16}
        fill="#FFF"
        fillRule="nonzero"
      />
      <Path
        d="M31.5 9 8 19.182v15.273C8 48.582 18.027 61.793 31.5 65 44.973 61.793 55 48.582 55 34.455V19.182L31.5 9Z"
        stroke="#1E2246"
        strokeWidth={6}
        fill="#FF7070"
        fillRule="nonzero"
      />
      <G transform="translate(6.5 14)" fill="#1E2246">
        <Path fillRule="nonzero" d="M26.73 30.17h-3.637l-.852-18.251h5.639z" />
        <Circle cx={24.5} cy={35} r={3} />
      </G>
    </G>
  </Svg>
)

export default SvgComponent

