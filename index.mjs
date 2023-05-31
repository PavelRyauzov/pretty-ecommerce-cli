#!/usr/bin/env node

import {exec, execSync} from 'child_process';
import inquirer from 'inquirer';
import * as path from "path";
import fs from "fs";
import os from "os";

let projectName;

inquirer
    .prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'Введите название проекта:',
            default: 'pretty-commerce'
        },
        {
            type: 'input',
            name: 'siteName',
            message: 'Введите название сайта:',
            default: 'Pretty commerce'
        },
        {
            type: 'confirm',
            name: 'importDataFromExtSystemFlag',
            message: 'Импортировать данные из внешней системы?',
        },
        {
            type: 'input',
            name: 'extSystemLogin',
            message: 'Введите логин для авторизации во внешней системе:',
            when: (answers) => answers.importDataFromExtSystemFlag,
        },
        {
            type: 'input',
            name: 'extSystemPassword',
            message: 'Введите пароль для авторизации во внешней системе:',
            when: (answers) => answers.importDataFromExtSystemFlag,
        },

    ])
    .then((answers) => {
        projectName = answers.projectName;

        const cloneUrl = 'https://github.com/PavelRyauzov/pretty-ecommerce';
        try {
            execSync(`git clone ${cloneUrl} ${projectName}`);
        } catch (error) {
            throw new Error(`Ошибка при клонировании проекта: ${error.message}`);
        }

        const gitDirectory = path.join(projectName, '.git');
        try {
            if (fs.existsSync(gitDirectory)) {
                execSync(`rm -rf ${gitDirectory}`);
            }
        } catch (error) {
            throw new Error(`Ошибка при удалении папки .git: ${error.message}`);
        }

        const { siteName } = answers;
        const clientEnvFilePath = path.join(projectName, 'client', '.env');
        try {
            setEnvValue(clientEnvFilePath, 'SITE_NAME', siteName);
        } catch (error) {
            throw new Error(`Ошибка при записи в файл .env: ${error.message}`);
        }

        console.log(`Проект успешно сгенерирован.`);

        const { importDataFromExtSystemFlag } = answers;

        if (!importDataFromExtSystemFlag) {
            console.log('Для заполнения базы данных сидами перейдите в директорию server,')
            console.log('в терминале введите команду \"pnpm install\",')
            console.log('затем \"pnpm dlx prisma db push\" для создания бд с помощью prisma,')
            console.log('перейдите в необходимую директорию \"cd lib/seed\",')
            console.log('выполните команду \"ts-node seed.ts\".')
        }
    }).catch((error) => {
        execSync(`rm -rf ${projectName}`);
        console.error(`Ошибка: ${error.message}`);
    });

function setEnvValue(filePath, key, value) {

    // read file from hdd & split if from a linebreak to a array
    const ENV_VARS = fs.readFileSync(filePath, "utf8").split(os.EOL);

    // find the env we want based on the key
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        return line.match(new RegExp(key));
    }));

    // replace the key/value with the new value
    ENV_VARS.splice(target, 1, `${key}=${value}`);

    // write everything back to the file system
    fs.writeFileSync(filePath, ENV_VARS.join(os.EOL));
}
