#!/usr/bin/env groovy

def installBuildRequirements(){
	def nodeHome = tool 'nodejs-12.20.0'
	env.PATH="${env.PATH}:${nodeHome}/bin"
	sh "npm install -g typescript vsce"
}

node('rhel8'){

	stage 'Checkout vscode-rhoas'
	deleteDir()
	git url: 'https://github.com/redhat-developer/vscode-rhoas.git'

	stage 'install vscode-rhoas build requirements'
	installBuildRequirements()

	stage 'Build vscode-rhoas'
	sh "npm install"
	sh "npm run vscode:prepublish"

	// stage 'Test vscode-rhoas for staging'
	// wrap([$class: 'Xvnc']) {
	// 	sh "npm run test-compile"
	// 	sh "npm test --silent"
	// }

	stage "Package vscode-rhoas"
	def packageJson = readJSON file: 'package.json'
	sh "vsce package -o vscode-rhoas-${packageJson.version}-${env.BUILD_NUMBER}.vsix"

	stage 'Upload vscode-rhoas to staging'
	def vsix = findFiles(glob: '**.vsix')
	sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${vsix[0].path} ${UPLOAD_LOCATION}/stable/vscode-rhoas/"
	stash name:'vsix', includes:vsix[0].path
}

node('rhel8'){
	timeout(time:5, unit:'DAYS') {
		input message:'Approve deployment?', submitter: 'fbricon'
	}

	stage "Publish to Marketplace"
	unstash 'vsix';

	def vsix = findFiles(glob: '**.vsix')
	// VS Code Marketplace
	withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
		sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
	}

	// Open-vsx Marketplace
	sh "npm install -g ovsx"
	withCredentials([[$class: 'StringBinding', credentialsId: 'open-vsx-access-token', variable: 'OVSX_TOKEN']]) {
		sh 'ovsx publish -p ${OVSX_TOKEN}' + " ${vsix[0].path}"
	}

	archive includes:"**.vsix"
}