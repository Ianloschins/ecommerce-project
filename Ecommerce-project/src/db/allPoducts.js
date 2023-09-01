const productsDB = [
    {
        id:1,
        title:'ZOTAC Gaming GeForce RTX 4070 Twin Edge OC DLSS 3 12GB GDDR6X 192-bit 21 Gbps PCIE 4.0 Compact Gaming Graphics Card, IceStorm 2.0 Advanced Cooling, Spectra RGB Lighting, ZT-D40700H-10M',
        price:'599.99',
        category:'Electronic',
        description:'The ZOTAC GAMING GeForce RTX 4070 Twin Edge OC is a compact and powerful graphics card, featuring the NVIDIA Ada Lovelace architecture and an aerodynamic-inspired design. With a reduced 2.2 slot size, its an excellent choice for those who want to build a SFF gaming PC capable of high framerate and performance in the latest title releases.',
        image:'https://m.media-amazon.com/images/I/81g7Hx94HaL._AC_SX425_.jpg'
    },
];

export function getAllProducts() {
    return productsDB;
}