'use strict';

import { BaseDocument, loopar } from 'loopar-env';
import axios from "axios";
import { elements_names } from "loopar-env";

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

    async prompt(prompt) {
        const data = {
            model: this.model,
            temperature: 0.9,
            //max_tokens: 150,
            top_p: 1,
            frequency_penalty: 0.0,
            presence_penalty: 0.6,
            //stop: [" Human:", " AI:"],
            messages: [
                { role: 'system', content: '¡Bienvenido!' },
                {
                    role: 'user', content: `
                I have a template generator that generates forms with these elements: ${elements_names.join(",")}
                 based on a metadata structure like this: ${JSON.stringify(this.exampleJSON)} resolve the following request:
                  "${prompt}", I want the metadata in JSON not in html, strictly with the format that I have shown you. Each element must have at least the name in the data;`
                }
            ]
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.api_key}`
        };

        return new Promise(resolve => {
            axios.post(this.url, data, { headers }).then(response => {
                const messages = response.data.choices[0].message.content;
                resolve(messages);
            }).catch(error => {
                loopar.throw(error);
            });
        });
    }
}