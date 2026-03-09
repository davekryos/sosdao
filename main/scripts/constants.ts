export function generateSVG(address: string, symbol: string, amount: string) {
  return `<svg width="290" height="500" viewBox="0 0 290 500" xmlns="http://www.w3.org/2000/svg"><style><![CDATA[text{font-family:Arial;font-weight:100}.alpha{opacity:0.5}.small{font-size:.8rem}.large{font-size:1.4rem}.huge{font-size:2rem}.title{fill:#fff}.bold{font-weight:bold}]]></style><path fill="url(#gradient)" d="M0 20 A 20 20 0 0 1 20 0 L 270 0 A 0 0 0 0 1 270 0 L 270 500 A 0 0 0 0 1 270 500 L 20 500 A 20 20 0 0 1 0 480 Z" /><path fill="#EC5728" d="M270 0h20v500h-20z" /><text class="title huge" fill="#FFF" transform="translate(30,60)"> <tspan class="bold">SOS</tspan><tspan class="alpha">DAO</tspan></text><text class="small" transform="rotate(90 132.5 142.5)" style="text-anchor:start" fill="#FFF">1</text><text class="small" transform="rotate(90 -107.5 382.5)" style="text-anchor:end" fill="#FFF">${address}</text><text class="title" transform="translate(30,110)"><tspan class="alpha" x="0">Pool</tspan><tspan x="0" dy="30">Pool</tspan></text><text class="title" transform="translate(30,200)"><tspan class="alpha" x="0">Donation</tspan><tspan x="0" dy="30">${amount} ${symbol}</tspan></text><defs><linearGradient id="gradient"><stop offset="0%" stop-color="#091D53"></stop><stop offset="100%" stop-color="#157C83"></stop></linearGradient></defs></svg>`;
}

export function dataURI(address: string, symbol: string, amount: string) {
  const svg = generateSVG(address, symbol, amount);

  return {
    name: "SOS DAO",
    description: "SOS DAO Donation NFT",
    image: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64"),
  };
}
