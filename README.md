# File sync tool

## Motivation
`rsync` is great for synchronizing identical trees, but for common manual backup and file management scenarios, there is a need for the synchronization of two different trees where there may be some non uniform overlap between various branches of the trees, as well as the possibility of duplicates in both the source and destination. 

The goal is to ensure all files in the source are represented at least once somewhere in the destination.

File identity is established trivially using the filename and size.

## Usage
- Clone this repo `git clone https://github.com/zhenyasav/sync`
- `cd sync` into the directory
- `npm install`
- Edit the file `config.json` to specify your source, destination folders and the exclude list.
- `npm run dry` will give you a report of what would be done should you execute the sync
- `npm start` will execute the sync
