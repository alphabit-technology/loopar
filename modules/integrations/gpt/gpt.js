'use strict';

import { BaseDocument, loopar } from 'loopar-env';
import axios from "axios";
import { elements_names, elementsNameByType } from "loopar-env";
import { OpenAIApi, Configuration } from "openai";

export default class GPT extends BaseDocument {
    exampleJSON = [
        {
            element: "row",
            elements: [
                {
                    element: "col",
                    elements: [
                        {
                            element: "input",
                            data: {
                                label: "Name",
                                name: "name"
                            }
                        },
                        {
                            element: "input",
                            data: {
                                label: "Input 1",
                                name: "input1"
                            }
                        }
                    ]
                },
                {
                    element: "col",
                    elements: [
                        {
                            element: "input",
                            data: {
                                label: "Input 2",
                                name: "input2"
                            }
                        },
                        {
                            element: "input",
                            data: {
                                label: "Input 3",
                                name: "input3"
                            }
                        }
                    ]
                }
            ],
        },
        {
            element: "row",
            elements: [
                {
                    element: "col",
                    elements: [
                        {
                            element: "input",
                            data: {
                                label: "Input ",
                                name: "input4"
                            }
                        },
                        {
                            element: "input",
                            data: {
                                label: "Input 5",
                                name: "input5"
                            }
                        }
                    ]
                },
                {
                    element: "col",
                    elements: [
                        {
                            element: "input",
                            data: {
                                label: "Input 6",
                                name: "input6"
                            }
                        },
                        {
                            element: "input",
                            data: {
                                label: "Input 7",
                                name: "input7"
                            }
                        }
                    ]
                }
            ],
        }
    ];

    constructor(props) {
        super(props);
    }

    validateSettings() {
        if(!this.api_key){
            loopar.throw("Please set the API key in the settings of the GPT module");
        }
    }

    async prompt(data) {
        this.validateSettings();
        const { prompt, document_type } = data;
        const elements = elements_names.filter(e => {
            if (document_type === "Document") {
                return e !== SECTION
            } else {
                return true;
            }
        });

        const message = `
                I have a template generator that generates forms and pages with these elements: ${elements.join(",")},
                 based on a metadata structure like this: ${JSON.stringify(this.exampleJSON)} resolve the following request:
                  "${prompt}", I need the metadata in JSON not in html, strictly with the format that I have shown you. Each element compulsorily requires the data with the name, label and id as a minimum.`

        const configuration = new Configuration({
            apiKey: this.api_key,
        });
        const openai = new OpenAIApi(configuration);

        const response = await openai.createChatCompletion({
            model: this.model,
            messages: [
                { role: 'system', content: '¡Welcome!' },
                {
                    "role": "user",
                    "content": message
                }
            ],
            temperature: 0.9,
            //max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
        });

        return response.data.choices[0].message.content;
    }
}