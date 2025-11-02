const push = jest.fn();
const useRouter = () => ({ push });
const usePathname = () => '/';
module.exports = { useRouter, usePathname };
