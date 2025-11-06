
export async function getBrands() {
    return fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas")
        .then(res => res.json());
}

export async function getModels(brandCode: string) {
    return fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos`)
        .then(res => res.json());
}

export async function getYears(brandCode: string, modelCode: string) {
    return fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${modelCode}/anos`)
        .then(res => res.json());
}

export async function getFipeValue(brandCode: string, modelCode: string, yearCode: string) {
    return fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`)
        .then(res => res.json());
}
