import PocketBase from 'pocketbase';

const pb = new PocketBase('http://100.101.61.50:8090');

pb.autoCancellation(false);

export default pb;